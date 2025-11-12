from django.db import models
from django.contrib.auth.models import AbstractUser
from django.urls import reverse
from django.contrib.auth.base_user import BaseUserManager
from django.db.models import Q, UniqueConstraint

# Custom user manager
class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        return self.create_user(email, password, **extra_fields)

# Create your models here.
class User(AbstractUser):
    @property
    def avatar_url(self):
        if self.avatar:
            try:
                return self.avatar.url
            except Exception:
                return None
        return None
    
    def get_absolute_url(self):
        return reverse("user-profile", kwargs={"pk": self.pk})
    
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('teacher', 'Teacher'),
        ('student', 'Student'),
    ]
    APPROVAL_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('unapproved', 'Unapproved'),
    ]
    username = None
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    name = models.CharField(max_length=150, blank=True, null=True)
    roll_number = models.CharField(max_length=10, null=True, blank=True, db_index=True)
    semester = models.CharField(max_length=20, blank=True, null=True)
    section = models.CharField(max_length=20, blank=True, null=True)
    department = models.CharField(max_length=50, blank=True, null=True)
    approval_status = models.CharField(max_length=15, choices=APPROVAL_CHOICES, default='pending')
    feedback = models.TextField(blank=True, null=True)  # feedback if unapproved

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['role', 'avatar', 'name']

    class Meta:
        constraints = [
            UniqueConstraint(
                fields=['roll_number'],
                name='unique_roll_number_not_null',
                condition=Q(roll_number__isnull=False)
            )
        ]

    def __str__(self):
        return self.name or self.email
