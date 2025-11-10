from django.db import models
from django.conf import settings
from academics.models import ClassSubject

# Create your models here.
class AttendanceSession(models.Model):
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('closed', 'Closed'),
    ]
    class_subject = models.ForeignKey(ClassSubject, on_delete=models.CASCADE)
    session_title = models.CharField(max_length=255, blank=True, null=True)
    date = models.DateField()
    started_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, limit_choices_to={'role': 'teacher'})
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='open')
    is_manual_allowed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Session for {self.class_subject} on {self.date}"


class AttendanceRecord(models.Model):
    ENTRY_STATUS_CHOICES = [
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('manual-present', 'Manual Present'),
    ]
    EXIT_STATUS_CHOICES = [
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('manual-exit', 'Manual Exit'),
    ]
    METHOD_CHOICES = [
        ('facial', 'Facial'),
        ('manual', 'Manual'),
    ]

    attendance_session = models.ForeignKey(AttendanceSession, on_delete=models.CASCADE)
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, limit_choices_to={'role': 'student'})
    entry_status = models.CharField(max_length=20, choices=ENTRY_STATUS_CHOICES)
    entry_method = models.CharField(max_length=10, choices=METHOD_CHOICES)
    entry_time = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    exit_status = models.CharField(max_length=20, choices=EXIT_STATUS_CHOICES, null=True, blank=True)
    exit_method = models.CharField(max_length=10, choices=METHOD_CHOICES, null=True, blank=True)
    exit_time = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Record for {self.student.username} - {self.attendance_session}"