"""
Modelos base abstractos para todas las aplicaciones.
"""
from django.db import models


class TimeStampedModel(models.Model):
    """
    Modelo abstracto que proporciona campos de timestamp automáticos.
    """
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Creado')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Actualizado')

    class Meta:
        abstract = True
