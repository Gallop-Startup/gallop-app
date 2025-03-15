"""
Django settings for gallop project.

Generated by 'django-admin startproject' using Django 5.1.5.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/5.1/ref/settings/
"""

from pathlib import Path
import os
import django_heroku
import dj_database_url
import base64

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv("SECRET_KEY")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv("DEBUG", "False") == "True"

ALLOWED_HOSTS = ["https://gallop-f748892b3829.herokuapp.com", "localhost", "127.0.0.1"]


# Application definition

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Project apps
    'rest_framework',
    'gallop_app',
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    'whitenoise.middleware.WhiteNoiseMiddleware',
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "gallop_app.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "gallop_project.wsgi.application"


# Database
# https://docs.djangoproject.com/en/5.1/ref/settings/#databases

# Decode the CA Certificate
DB_CA_CERT = os.getenv("DB_SSL_CA")
if DB_CA_CERT:
    ca_cert_path = "/tmp/ca-certificate.crt"
    with open(ca_cert_path, "wb") as f:
        f.write(base64.b64decode(DB_CA_CERT))
else:
    ca_cert_path = None

# Configure Database
DATABASES = {
    "default": dj_database_url.config(
        default=os.environ.get("DATABASE_URL"), 
        conn_max_age=600,
    )
}

# Add SSL Configuration
if ca_cert_path:
    DATABASES["default"]["OPTIONS"] = {
        "ssl": {
            "ca": ca_cert_path,
        }
    }

#DATABASES = {
#   "default": {
#      "ENGINE": "django.db.backends.mysql",
#        "NAME": os.getenv("DB_NAME"),
#        "USER": os.getenv("DB_USER"),
#        "PASSWORD": os.getenv("DB_PASSWORD"),
#        "HOST": os.getenv("DB_HOST"),
#        "PORT": os.getenv("DB_PORT"),
#        "OPTIONS": {
#            "ssl": {
#                "ca": os.getenv("DB_SSL_CA"),
#            }
#        }
#    }
#}

# Load the database URL from Heroku or environment variables



# Password validation
# https://docs.djangoproject.com/en/5.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.1/topics/i18n/

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.1/howto/static-files/

STATIC_URL = "/static/"
#STATICFILES_DIRS = [os.path.join(BASE_DIR, 'gallop_app/static')]
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Default primary key field type
# https://docs.djangoproject.com/en/5.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Activate Django-Heroku.
django_heroku.settings(locals())
