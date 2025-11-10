from django.db import models
from django.conf import settings

# Create your models here.
class Class(models.Model):
    name = models.CharField(max_length=100)
    year = models.IntegerField()
    semester = models.IntegerField()
    department = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - Sem {self.semester}"


class Subject(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.code} - {self.name}"


class ClassSubject(models.Model):
    class_instance = models.ForeignKey(Class, on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, limit_choices_to={'role': 'teacher'})
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.class_instance.name} - {self.subject.name}"


class StudentClassEnrollment(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, limit_choices_to={'role': 'student'})
    enrolled_class = models.ForeignKey(Class, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('enrolled_class', 'student')

    def __str__(self):
        return f"{self.student.name} - {self.enrolled_class.name} (Roll: {self.student.roll_number})"