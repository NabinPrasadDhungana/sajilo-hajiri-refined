from django.db import models
from django.conf import settings
from academics.models import ClassSubject

# Create your models here.
class AttendanceReport(models.Model):
    REPORT_TYPE_CHOICES = [
        ('individual', 'Individual'),
        ('class', 'Class'),
        ('subject', 'Subject'),
    ]
    STATUS_CHOICES = [
        ('generated', 'Generated'),
        ('processing', 'Processing'),
        ('downloaded', 'Downloaded'),
        ('failed', 'Failed'),
    ]

    generated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    student = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='report_student')
    class_subject = models.ForeignKey(ClassSubject, null=True, blank=True, on_delete=models.SET_NULL)
    from_date = models.DateField()
    to_date = models.DateField()
    report_type = models.CharField(max_length=20, choices=REPORT_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='generated')
    report_file = models.FileField(upload_to='attendance_reports/', null=True, blank=True)
    title = models.CharField(max_length=255, null=True, blank=True)
    generated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title or f"{self.report_type} report from {self.from_date} to {self.to_date}"