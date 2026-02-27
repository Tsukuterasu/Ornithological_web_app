from datetime import date
from uuid import uuid4

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def _generate_uuid():
    return str(uuid4())


class Taxonomy(db.Model):
    __tablename__ = "taxonomy"

    taxonomy_id = db.Column(db.String(36), primary_key=True, default=_generate_uuid)
    taxonomy_kingdom = db.Column(db.String(80))
    taxonomy_phylum = db.Column(db.String(80))
    taxonomy_class = db.Column(db.String(80))
    taxonomy_order = db.Column(db.String(80))
    taxonomy_suborder = db.Column(db.String(80))
    taxonomy_family = db.Column(db.String(80))
    taxonomy_genus = db.Column(db.String(80))

    species_list = db.relationship("Species", back_populates="taxonomy")


class Author(db.Model):
    __tablename__ = "author"

    author_id = db.Column(db.String(36), primary_key=True, default=_generate_uuid)
    author_name = db.Column(db.String(120), nullable=False)
    author_email = db.Column(db.String(120))
    author_role = db.Column(db.String(120))

    images = db.relationship("Image", back_populates="author")
    modifications = db.relationship("Modification", back_populates="author")


class Species(db.Model):
    __tablename__ = "species"

    species_id = db.Column(db.String(36), primary_key=True, default=_generate_uuid)
    common_name = db.Column(db.String(120), nullable=False)
    scientific_name = db.Column(db.String(120))
    conservation_status = db.Column(db.String(120))
    population_estimate = db.Column(db.Integer)
    height_cm = db.Column(db.Float)
    weight_g = db.Column(db.Float)
    longevity_years = db.Column(db.Integer)
    year_of_discovery = db.Column(db.Date)
    summary = db.Column(db.Text)
    created_at = db.Column(db.Date, default=date.today, nullable=False)

    taxonomy_id = db.Column(db.String(36), db.ForeignKey("taxonomy.taxonomy_id"))

    taxonomy = db.relationship("Taxonomy", back_populates="species_list")
    images = db.relationship(
        "Image", back_populates="species", cascade="all, delete-orphan"
    )
    distributions = db.relationship(
        "Distribution", back_populates="species", cascade="all, delete-orphan"
    )
    modifications = db.relationship(
        "Modification", back_populates="species", cascade="all, delete-orphan"
    )


class Image(db.Model):
    __tablename__ = "image"

    image_id = db.Column(db.String(36), primary_key=True, default=_generate_uuid)
    image_url = db.Column(db.String(500))
    image_alt_text = db.Column(db.String(255))
    created_at = db.Column(db.Date, default=date.today, nullable=False)
    author_id = db.Column(db.String(36), db.ForeignKey("author.author_id"))
    species_id = db.Column(
        db.String(36), db.ForeignKey("species.species_id"), nullable=False
    )

    species = db.relationship("Species", back_populates="images")
    author = db.relationship("Author", back_populates="images")


class Country(db.Model):
    __tablename__ = "country"

    country_id = db.Column(db.String(36), primary_key=True, default=_generate_uuid)
    country_name = db.Column(db.String(120), nullable=False)
    continent_name = db.Column(db.String(120))
    country_loc = db.Column(db.JSON)

    distributions = db.relationship("Distribution", back_populates="country")


class Distribution(db.Model):
    __tablename__ = "distribution"

    distribution_id = db.Column(
        db.String(36), primary_key=True, default=_generate_uuid
    )
    species_id = db.Column(
        db.String(36), db.ForeignKey("species.species_id"), nullable=False
    )
    country_id = db.Column(
        db.String(36), db.ForeignKey("country.country_id"), nullable=False
    )
    population_estimate = db.Column(db.Integer)

    species = db.relationship("Species", back_populates="distributions")
    country = db.relationship("Country", back_populates="distributions")


class Modification(db.Model):
    __tablename__ = "modification"

    modif_id = db.Column(db.String(36), primary_key=True, default=_generate_uuid)
    author_id = db.Column(db.String(36), db.ForeignKey("author.author_id"))
    species_id = db.Column(
        db.String(36), db.ForeignKey("species.species_id"), nullable=False
    )
    modif_date = db.Column(db.Date, default=date.today, nullable=False)
    modif_fields = db.Column(db.JSON)

    author = db.relationship("Author", back_populates="modifications")
    species = db.relationship("Species", back_populates="modifications")
