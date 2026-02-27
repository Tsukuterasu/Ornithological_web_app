import os
from datetime import date
from uuid import UUID, uuid4

from flask import Flask, current_app, jsonify, request, send_from_directory
from werkzeug.utils import secure_filename

from models import Author, Image, Modification, Species, Taxonomy, db


SORT_FIELDS = {
    "population": Species.population_estimate,
    "population_estimate": Species.population_estimate,
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

    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    db.init_app(app)

    @app.cli.command("init-db")
    def init_db():
        db.create_all()
        print("Database initialized.")

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
            conservation_status=_get_value(data, "conservation_status"),
            population_estimate=_parse_int(_get_value(data, "population_estimate")),
            year_of_discovery=_parse_date(_get_value(data, "year_of_discovery")),
            summary=_get_value(data, "summary"),
        )

        _attach_taxonomy(species, data)

        db.session.add(species)
        db.session.flush()

        author = _resolve_author(data)
        image = _create_image(species, data, image_file, author)
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
            species.conservation_status = _get_value(data, "conservation_status")
            changed_fields.append("conservation_status")
        if "population_estimate" in data:
            species.population_estimate = _parse_int(
                _get_value(data, "population_estimate")
            )
            changed_fields.append("population_estimate")
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
        for image in species.images:
            _delete_image_file(image, app.config["UPLOAD_FOLDER"])

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


def _delete_image_file(image, upload_folder):
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


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
