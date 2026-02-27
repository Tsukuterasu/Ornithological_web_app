import json
import os
import random
import shutil
from datetime import date
from uuid import UUID, uuid4

from flask import Flask, current_app, jsonify, request, send_from_directory
import click
from werkzeug.utils import secure_filename

from models import (
    Author,
    Country,
    Distribution,
    Image,
    Modification,
    Species,
    Taxonomy,
    db,
)


SORT_FIELDS = {
    "common_name": Species.common_name,
    "population": Species.population_estimate,
    "population_estimate": Species.population_estimate,
    "height": Species.height_cm,
    "height_cm": Species.height_cm,
    "weight": Species.weight_g,
    "weight_g": Species.weight_g,
    "longevity": Species.longevity_years,
    "longevity_years": Species.longevity_years,
    "year_of_discovery": Species.year_of_discovery,
    "created_at": Species.created_at,
}


def create_app():
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
        "DATABASE_URL", "sqlite:///ornithology.db"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["UPLOAD_FOLDER"] = os.getenv("UPLOAD_FOLDER", "uploads")
    app.config["MAX_CONTENT_LENGTH"] = 15 * 1024 * 1024
    app.config["DEFAULT_IMAGE_FILENAME"] = os.getenv("DEFAULT_IMAGE_FILENAME", "base_fill.png")
    app.config["DEFAULT_IMAGE_SOURCE"] = os.path.abspath(
        os.path.join(app.root_path, "..", "bird_app", "assets", "base_fill.png")
    )

    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    db.init_app(app)

    @app.after_request
    def add_cors_headers(response):
        response.headers["Access-Control-Allow-Origin"] = os.getenv(
            "CORS_ORIGIN", "*"
        )
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers["Access-Control-Allow-Methods"] = (
            "GET, POST, PUT, DELETE"
        )
        return response

    @app.cli.command("init-db")
    def init_db():
        db.create_all()
        print("Database initialized.")

    @app.cli.command("seed-db")
    @click.option("--count", default=30, show_default=True, type=int)
    def seed_db(count):
        """Populate the database with dataset-backed seed data."""
        with app.app_context():
            db.create_all()
            seeded = _seed_fake_data(count)
            if seeded:
                print(f"Seeded database with {count} entries per table.")
            else:
                print("Database already contains data. Skipping seed.")

    if os.getenv("SEED_ON_STARTUP") == "1":
        with app.app_context():
            db.create_all()
            _seed_fake_data(30)


    # Define API routes
    @app.route("/", methods=["GET"])
    def index():
        return jsonify({"message": "Welcome to the Ornithological Species API!", "status": "ok"})
    
    @app.route("/api/docs", methods=["GET"])
    def api_docs():
        return jsonify({
            "endpoints": {
                "/ [GET]": "API status and welcome message.",
                "/api/docs [GET]": "API documentation and endpoint listing.",
                "/api/species [POST]": "Create a new species entry.",
                "/api/species [GET]": "List all species with optional sorting.",
                "/api/species/<species_id> [GET]": "Get details of a specific species.",
                "/api/species/<species_id> [PUT]": "Update an existing species entry.",
                "/api/species/<species_id> [DELETE]": "Delete a species entry."
            },
            "description": "This API allows you to manage ornithological species data, including taxonomy, images, and distribution information."
        })

    @app.route("/uploads/<path:filename>")
    def uploaded_file(filename):
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

    @app.route("/api/species", methods=["POST"])
    def create_species():
        data, image_file = _get_payload()

        common_name = _get_value(data, "common_name")
        if not common_name:
            return jsonify({"error": "common_name is required"}), 400

        species = Species(
            common_name=common_name,
            scientific_name=_get_value(data, "scientific_name"),
            conservation_status=_normalize_conservation_status(
                _get_value(data, "conservation_status")
            ),
            population_estimate=_parse_int(_get_value(data, "population_estimate")),
            height_cm=_parse_float(_get_value(data, "height_cm")),
            weight_g=_parse_float(_get_value(data, "weight_g")),
            longevity_years=_parse_int(_get_value(data, "longevity_years")),
            year_of_discovery=_parse_date(_get_value(data, "year_of_discovery")),
            summary=_get_value(data, "summary"),
        )

        _attach_taxonomy(species, data)

        db.session.add(species)
        db.session.flush()

        author = _resolve_author(data)
        image = _create_image(species, data, image_file, author)
        if image is None:
            image = _create_default_image(species)
        if image:
            db.session.add(image)
        if author:
            db.session.add(
                Modification(
                    species=species,
                    author=author,
                    modif_fields={"action": "create"},
                )
            )

        db.session.commit()
        return jsonify(_serialize_species(species)), 201

    @app.route("/api/species/<string:species_id>", methods=["GET"])
    def get_species(species_id):
        species = Species.query.get_or_404(species_id)
        return jsonify(_serialize_species(species))

    @app.route("/api/species", methods=["GET"])
    def list_species():
        query = Species.query

        sort_key = request.args.get("sort")
        if sort_key:
            column = SORT_FIELDS.get(sort_key)
            if column is None:
                return jsonify({"error": "Invalid sort field"}), 400
            order = request.args.get("order", "asc").lower()
            if order == "desc":
                column = column.desc()
            elif order != "asc":
                return jsonify({"error": "Invalid order value"}), 400
            query = query.order_by(column)

        species_list = query.all()
        return jsonify([_serialize_species(item) for item in species_list])

    @app.route("/api/species/<string:species_id>", methods=["PUT"])
    def update_species(species_id):
        species = Species.query.get_or_404(species_id)
        data, image_file = _get_payload()

        changed_fields = []

        if "common_name" in data:
            species.common_name = _get_value(data, "common_name")
            changed_fields.append("common_name")
        if "scientific_name" in data:
            species.scientific_name = _get_value(data, "scientific_name")
            changed_fields.append("scientific_name")
        if "conservation_status" in data:
            species.conservation_status = _normalize_conservation_status(
                _get_value(data, "conservation_status")
            )
            changed_fields.append("conservation_status")
        if "population_estimate" in data:
            species.population_estimate = _parse_int(
                _get_value(data, "population_estimate")
            )
            changed_fields.append("population_estimate")
        if "height_cm" in data:
            species.height_cm = _parse_float(_get_value(data, "height_cm"))
            changed_fields.append("height_cm")
        if "weight_g" in data:
            species.weight_g = _parse_float(_get_value(data, "weight_g"))
            changed_fields.append("weight_g")
        if "longevity_years" in data:
            species.longevity_years = _parse_int(_get_value(data, "longevity_years"))
            changed_fields.append("longevity_years")
        if "year_of_discovery" in data:
            species.year_of_discovery = _parse_date(
                _get_value(data, "year_of_discovery")
            )
            changed_fields.append("year_of_discovery")
        if "summary" in data:
            species.summary = _get_value(data, "summary")
            changed_fields.append("summary")

        taxonomy_changed = _attach_taxonomy(species, data)
        if taxonomy_changed:
            changed_fields.append("taxonomy")

        author = _resolve_author(data)
        image = _create_image(species, data, image_file, author)
        if image:
            db.session.add(image)
            changed_fields.append("image")

        if author and changed_fields:
            db.session.add(
                Modification(
                    species=species,
                    author=author,
                    modif_fields={"updated_fields": sorted(set(changed_fields))},
                )
            )

        db.session.commit()
        return jsonify(_serialize_species(species))

    @app.route("/api/species/<string:species_id>", methods=["DELETE"])
    def delete_species(species_id):
        species = Species.query.get_or_404(species_id)
        default_url = _get_default_image_url()
        for image in species.images:
            _delete_image_file(image, app.config["UPLOAD_FOLDER"], default_url)

        db.session.delete(species)
        db.session.commit()
        return jsonify({"status": "deleted"})

    return app


def _get_payload():
    if request.is_json:
        data = request.get_json(silent=True) or {}
        return data, None

    data = request.form.to_dict()
    return data, request.files.get("image")


def _get_value(data, key):
    if isinstance(data, dict):
        return data.get(key)
    return None


def _parse_int(value):
    if value is None or value == "":
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _parse_float(value):
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _parse_date(value):
    if value is None or value == "":
        return None
    if isinstance(value, date):
        return value
    value_str = str(value).strip()
    if len(value_str) == 4 and value_str.isdigit():
        return date(int(value_str), 1, 1)
    try:
        return date.fromisoformat(value_str)
    except ValueError:
        return None


def _normalize_uuid(value):
    if value is None or value == "":
        return None
    try:
        return str(UUID(str(value)))
    except (TypeError, ValueError):
        return None


def _attach_taxonomy(species, data):
    taxonomy_data = _get_value(data, "taxonomy")
    taxonomy_id = _normalize_uuid(_get_value(data, "taxonomy_id"))

    if isinstance(taxonomy_data, dict):
        taxonomy = Taxonomy(
            taxonomy_kingdom=taxonomy_data.get("taxonomy_kingdom"),
            taxonomy_phylum=taxonomy_data.get("taxonomy_phylum"),
            taxonomy_class=taxonomy_data.get("taxonomy_class"),
            taxonomy_order=taxonomy_data.get("taxonomy_order"),
            taxonomy_suborder=taxonomy_data.get("taxonomy_suborder"),
            taxonomy_family=taxonomy_data.get("taxonomy_family"),
            taxonomy_genus=taxonomy_data.get("taxonomy_genus"),
        )
        db.session.add(taxonomy)
        species.taxonomy = taxonomy
        return True
    elif taxonomy_id:
        taxonomy = Taxonomy.query.get(taxonomy_id)
        if taxonomy and taxonomy != species.taxonomy:
            species.taxonomy = taxonomy
            return True

    return False


def _normalize_conservation_status(value):
    if value is None:
        return None
    cleaned = str(value).strip().lower()
    if not cleaned:
        return None
    cleaned = "".join(ch if ch.isalpha() else " " for ch in cleaned)
    cleaned = " ".join(cleaned.split())
    mapping = {
        "least concern": "least_concern",
        "near threatened": "near_threatened",
        "vulnerable": "vulnerable",
        "endangered": "endangered",
        "critically endangered": "critically_endangered",
        "extinct in the wild": "extinct_in_the_wild",
        "extinct": "extinct",
    }
    return mapping.get(cleaned, cleaned.replace(" ", "_"))


def _resolve_author(data):
    author_data = _get_value(data, "author")
    author_id = _normalize_uuid(_get_value(data, "author_id"))

    if isinstance(author_data, dict):
        author = Author(
            author_name=author_data.get("author_name", "").strip() or "Unknown",
            author_email=author_data.get("author_email"),
            author_role=author_data.get("author_role"),
        )
        db.session.add(author)
        return author
    if isinstance(author_data, str) and author_data.strip():
        author = Author(author_name=author_data.strip())
        db.session.add(author)
        return author
    if author_id:
        return Author.query.get(author_id)

    return None


def _create_image(species, data, image_file, author):
    image_url = _get_value(data, "image_url")
    image_alt_text = _get_value(data, "image_alt_text")

    if image_file and image_file.filename:
        filename = secure_filename(image_file.filename)
        unique_name = f"{uuid4().hex}_{filename}" if filename else uuid4().hex
        upload_folder = current_app.config["UPLOAD_FOLDER"]
        file_path = os.path.join(upload_folder, unique_name)
        image_file.save(file_path)
        return Image(
            species=species,
            image_url=f"/uploads/{unique_name}",
            image_alt_text=image_alt_text,
            author=author,
        )

    if image_url:
        return Image(
            species=species,
            image_url=image_url,
            image_alt_text=image_alt_text,
            author=author,
        )

    return None


def _delete_image_file(image, upload_folder, default_url):
    if default_url and image.image_url == default_url:
        return
    if not image.image_url:
        return
    uploads_prefix = "/uploads/"
    if not image.image_url.startswith(uploads_prefix):
        return
    filename = image.image_url[len(uploads_prefix) :]
    file_path = os.path.join(upload_folder, filename)
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except OSError:
        pass


def _serialize_species(species):
    return {
        "species_id": species.species_id,
        "common_name": species.common_name,
        "scientific_name": species.scientific_name,
        "conservation_status": species.conservation_status,
        "population_estimate": species.population_estimate,
        "height_cm": species.height_cm,
        "weight_g": species.weight_g,
        "longevity_years": species.longevity_years,
        "year_of_discovery": _format_date(species.year_of_discovery),
        "summary": species.summary,
        "created_at": _format_date(species.created_at),
        "taxonomy": _serialize_taxonomy(species.taxonomy),
        "images": [_serialize_image(image) for image in species.images],
    }


def _serialize_taxonomy(taxonomy):
    if taxonomy is None:
        return None
    return {
        "taxonomy_id": taxonomy.taxonomy_id,
        "taxonomy_kingdom": taxonomy.taxonomy_kingdom,
        "taxonomy_phylum": taxonomy.taxonomy_phylum,
        "taxonomy_class": taxonomy.taxonomy_class,
        "taxonomy_order": taxonomy.taxonomy_order,
        "taxonomy_suborder": taxonomy.taxonomy_suborder,
        "taxonomy_family": taxonomy.taxonomy_family,
        "taxonomy_genus": taxonomy.taxonomy_genus,
    }


def _serialize_author(author):
    if author is None:
        return None
    return {
        "author_id": author.author_id,
        "author_name": author.author_name,
        "author_email": author.author_email,
        "author_role": author.author_role,
    }


def _serialize_image(image):
    return {
        "image_id": image.image_id,
        "image_url": image.image_url,
        "image_alt_text": image.image_alt_text,
        "created_at": _format_date(image.created_at),
        "author": _serialize_author(image.author),
    }


def _format_date(value):
    if value is None:
        return None
    return value.isoformat()


def _get_default_image_url():
    upload_folder = current_app.config.get("UPLOAD_FOLDER")
    filename = current_app.config.get("DEFAULT_IMAGE_FILENAME")
    source_path = current_app.config.get("DEFAULT_IMAGE_SOURCE")
    if not upload_folder or not filename or not source_path:
        return None
    if not os.path.exists(source_path):
        return None
    os.makedirs(upload_folder, exist_ok=True)
    target_path = os.path.join(upload_folder, filename)
    if not os.path.exists(target_path):
        try:
            shutil.copyfile(source_path, target_path)
        except OSError:
            return None
    return f"/uploads/{filename}"


def _create_default_image(species):
    default_url = _get_default_image_url()
    if not default_url:
        return None
    return Image(
        species=species,
        image_url=default_url,
        image_alt_text=f"Default image for {species.common_name}",
    )


def _seed_fake_data(count):
    if Species.query.first():
        return False

    dataset_species = _load_seed_species()
    if dataset_species:
        return _seed_from_dataset(dataset_species, count)

    return False


def _load_seed_species():
    seed_path = os.path.join(os.path.dirname(__file__), "seed_species.json")
    try:
        with open(seed_path, "r", encoding="utf-8") as handle:
            payload = json.load(handle)
    except (OSError, json.JSONDecodeError):
        return []

    entries = []
    if isinstance(payload, list):
        for item in payload:
            if not isinstance(item, dict):
                continue
            common_name = str(item.get("common_name", "")).strip()
            scientific_name = str(item.get("scientific_name", "")).strip()
            if not common_name:
                continue
            entries.append(
                {
                    "common_name": common_name,
                    "scientific_name": scientific_name or None,
                    "summary": item.get("summary"),
                    "conservation_status": item.get("conservation_status"),
                    "population_estimate": _parse_int(item.get("population_estimate")),
                    "year_of_discovery": _parse_date(item.get("year_of_discovery")),
                    "height_cm": _parse_float(item.get("height_cm")),
                    "weight_g": _parse_float(item.get("weight_g")),
                    "longevity_years": _parse_int(item.get("longevity_years")),
                }
            )
    return entries


def _build_taxonomy_from_scientific(scientific_name):
    genus = None
    if scientific_name:
        genus = scientific_name.split()[0]
    return Taxonomy(
        taxonomy_kingdom="Animalia",
        taxonomy_phylum="Chordata",
        taxonomy_class="Aves",
        taxonomy_genus=genus,
    )


def _seed_from_dataset(entries, count):
    author = Author(
        author_name="Dataset Import",
        author_email="dataset@example.org",
        author_role="Data Import",
    )

    selected = entries[: max(1, min(count, len(entries)))]
    countries = _seed_countries(len(selected))
    db.session.add_all([author] + countries)
    db.session.flush()

    species_list = []
    taxonomies = []
    for entry in selected:
        characteristics = _random_characteristics()
        taxonomy = _build_taxonomy_from_scientific(entry.get("scientific_name"))
        taxonomies.append(taxonomy)
        species_list.append(
            Species(
                common_name=entry.get("common_name"),
                scientific_name=entry.get("scientific_name"),
                conservation_status=_normalize_conservation_status(
                    entry.get("conservation_status")
                ),
                population_estimate=_parse_int(entry.get("population_estimate")),
                height_cm=entry.get("height_cm", characteristics["height_cm"]),
                weight_g=entry.get("weight_g", characteristics["weight_g"]),
                longevity_years=entry.get(
                    "longevity_years", characteristics["longevity_years"]
                ),
                year_of_discovery=_parse_date(entry.get("year_of_discovery")),
                summary=entry.get("summary")
                or "Listed in a published bird species checklist dataset.",
                taxonomy=taxonomy,
            )
        )

    db.session.add_all(taxonomies + species_list)
    db.session.flush()

    images = []
    modifications = []
    distributions = []
    default_url = _get_default_image_url()

    for i, species in enumerate(species_list):
        images.append(
            Image(
                species=species,
                author=author,
                image_url=default_url,
                image_alt_text=f"Default image for {species.common_name}",
            )
        )
        modifications.append(
            Modification(
                species=species,
                author=author,
                modif_fields={
                    "action": "seed",
                    "source": "Meeman Biological Station bird list",
                },
            )
        )
        distributions.append(
            Distribution(
                species=species,
                country=countries[i % len(countries)],
                population_estimate=None,
            )
        )

    db.session.add_all(images + modifications + distributions)
    db.session.commit()
    return True


def _seed_countries(count):
    country_names = [
        ("Kenya", "Africa"),
        ("Tanzania", "Africa"),
        ("South Africa", "Africa"),
        ("France", "Europe"),
        ("Spain", "Europe"),
        ("Germany", "Europe"),
        ("Norway", "Europe"),
        ("United Kingdom", "Europe"),
        ("United States", "Americas"),
        ("Canada", "Americas"),
        ("Brazil", "Americas"),
        ("Peru", "Americas"),
        ("Argentina", "Americas"),
        ("Mexico", "Americas"),
        ("India", "Asia"),
        ("China", "Asia"),
        ("Japan", "Asia"),
        ("Indonesia", "Asia"),
        ("Australia", "Oceania"),
        ("New Zealand", "Oceania"),
    ]
    countries = []
    for i in range(count):
        name, continent = country_names[i % len(country_names)]
        countries.append(
            Country(
                country_name=name,
                continent_name=continent,
                country_loc={
                    "lat": round(random.uniform(-50, 60), 4),
                    "lng": round(random.uniform(-120, 140), 4),
                },
            )
        )
    return countries


def _random_characteristics():
    return {
        "height_cm": round(random.uniform(10, 160), 1),
        "weight_g": round(random.uniform(50, 6000), 1),
        "longevity_years": random.randint(3, 55),
    }


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
