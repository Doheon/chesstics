from django.db import models

# Create your models here.

class Chess(models.Model):
    winner = models.CharField(default = "", max_length=30)
    moves = models.CharField(default = "", max_length=200)