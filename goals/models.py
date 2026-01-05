from django.db import models
from django.contrib.auth.models import User

class Goal(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='goals', default=1)
    title = models.CharField(max_length=200)
    purpose = models.TextField(blank=True)
    carrot = models.TextField(blank=True)
    stick = models.TextField(blank=True)
    total_days = models.PositiveIntegerField()
    start_date = models.DateField(auto_now_add=True)

    def __str__(self):
        return self.title

class Subgoal(models.Model):
    parent_goal = models.ForeignKey(Goal, related_name='subgoals', on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    assigned_days = models.PositiveIntegerField()
    buffer_days = models.PositiveIntegerField(default=0)
    completed = models.BooleanField(default=False)
    parent_subgoal = models.ForeignKey('self', null=True, blank=True, related_name='subgoals', on_delete=models.CASCADE)

    def __str__(self):
        return self.title

class Timeblock(models.Model):
    FREQUENCY_CHOICES = [
        ('daily', 'Daily'),
        ('weekdays', 'Weekdays (Mon-Fri)'),
        ('weekends', 'Weekends (Sat-Sun)'),
        ('alternate', 'Every Other Day'),
        ('custom', 'Custom Days'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='timeblocks', default=1)
    goal = models.ForeignKey(Goal, related_name='timeblocks', on_delete=models.CASCADE, null=True, blank=True)
    subgoal = models.ForeignKey(Subgoal, null=True, blank=True, related_name='timeblocks', on_delete=models.SET_NULL)
    
    # For standalone tasks
    task_title = models.CharField(max_length=200, blank=True)
    
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    
    # For recurring timeblocks
    is_recurring = models.BooleanField(default=False)
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, blank=True)
    end_date = models.DateField(null=True, blank=True)
    custom_days = models.CharField(max_length=20, blank=True)  # Store as "1,3,5" for Mon,Wed,Fri

    def __str__(self):
        if self.goal:
            return f"{self.goal.title} - {self.date} ({self.start_time}-{self.end_time})"
        else:
            return f"{self.task_title} - {self.date} ({self.start_time}-{self.end_time})"
