from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth import login, authenticate
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import Goal
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json


# Authentication views
def register_view(request):
    # Redirect if user is already logged in
    if request.user.is_authenticated:
        return redirect('index')
        
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            username = form.cleaned_data.get('username')
            messages.success(request, f'Account created successfully for {username}! Please log in.')
            return redirect('login')
        else:
            # Form has errors, they will be displayed in the template
            pass
    else:
        form = UserCreationForm()
    return render(request, 'register.html', {'form': form})

def login_view(request):
    # Redirect if user is already logged in
    if request.user.is_authenticated:
        return redirect('index')
        
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect('index')
        else:
            messages.error(request, 'Invalid username or password.')
    return render(request, 'login.html')

# Landing page (public)
def landing(request):
    return render(request, "landing.html")

# Home page (authenticated users only)
@login_required
def index(request):
    return render(request, "index.html")


@csrf_exempt
@login_required
def create_goal(request):
    if request.method == "POST":
        data = json.loads(request.body)
        goal = Goal.objects.create(
            user=request.user,
            title=data['title'],
            purpose=data['purpose'],
            carrot=data['carrot'],
            stick=data['stick'],
            total_days=data['total_days']
        )
        return JsonResponse({
            'id': goal.id,
            'title': goal.title,
            'purpose': goal.purpose,
            'carrot': goal.carrot,
            'stick': goal.stick,
            'total_days': goal.total_days,
            'start_date': goal.start_date.isoformat(),
            'subgoals': [],
            'timeblocks': []
        })


def build_subgoal_tree(subgoal):
    """Recursively build subgoal tree with nested subgoals"""
    return {
        'id': subgoal.id,
        'title': subgoal.title,
        'assignedDays': subgoal.assigned_days,
        'bufferDays': subgoal.buffer_days,
        'completed': subgoal.completed,
        'subgoals': [build_subgoal_tree(child) for child in subgoal.subgoals.all()]
    }

@csrf_exempt
@login_required
def get_goals(request):
    if request.method == "GET":
        goals = Goal.objects.filter(user=request.user).prefetch_related('subgoals__subgoals', 'timeblocks').all()
        goals_data = []
        for goal in goals:
            # Get subgoals data with full nesting
            subgoals_data = []
            for subgoal in goal.subgoals.filter(parent_subgoal=None):  # Only top-level subgoals
                subgoals_data.append(build_subgoal_tree(subgoal))
            
            # Get timeblocks data
            timeblocks_data = []
            for timeblock in goal.timeblocks.all():
                timeblocks_data.append({
                    'date': timeblock.date.isoformat(),
                    'startTime': timeblock.start_time.strftime('%I:%M %p'),
                    'endTime': timeblock.end_time.strftime('%I:%M %p'),
                    'subgoalTitle': timeblock.subgoal.title if timeblock.subgoal else 'Main Goal'
                })
            
            goals_data.append({
                'id': goal.id,
                'title': goal.title,
                'purpose': goal.purpose,
                'carrot': goal.carrot,
                'stick': goal.stick,
                'total_days': goal.total_days,
                'start_date': goal.start_date.isoformat(),
                'subgoals': subgoals_data,
                'timeblocks': timeblocks_data
            })
        return JsonResponse({'goals': goals_data})


@csrf_exempt
@login_required
def delete_goal(request, id):
    if request.method == "DELETE":
        goal = get_object_or_404(Goal, id=id, user=request.user)
        goal.delete()
        return JsonResponse({'success': True, 'message': 'Goal deleted successfully'})
    return JsonResponse({'success': False, 'message': 'Invalid request method'})


@csrf_exempt
def create_subgoal(request):
    if request.method == "POST":
        from .models import Subgoal
        data = json.loads(request.body)
        
        goal = get_object_or_404(Goal, id=data['goal_id'])
        parent_subgoal = None
        if data.get('parent_subgoal_id'):
            parent_subgoal = get_object_or_404(Subgoal, id=data['parent_subgoal_id'])
        
        subgoal = Subgoal.objects.create(
            parent_goal=goal,
            parent_subgoal=parent_subgoal,
            title=data['title'],
            assigned_days=data['assigned_days'],
            buffer_days=data.get('buffer_days', 0),
            completed=False
        )
        
        return JsonResponse({
            'id': subgoal.id,
            'title': subgoal.title,
            'assignedDays': subgoal.assigned_days,
            'bufferDays': subgoal.buffer_days,
            'completed': subgoal.completed,
            'subgoals': []
        })

@csrf_exempt
def update_subgoal(request, id):
    if request.method == "PUT":
        from .models import Subgoal
        subgoal = get_object_or_404(Subgoal, id=id)
        data = json.loads(request.body)
        
        if 'completed' in data:
            subgoal.completed = data['completed']
            subgoal.save()
            
        return JsonResponse({
            'id': subgoal.id,
            'completed': subgoal.completed,
            'success': True
        })

@csrf_exempt
def delete_subgoal(request, id):
    if request.method == "DELETE":
        from .models import Subgoal
        subgoal = get_object_or_404(Subgoal, id=id)
        subgoal.delete()
        return JsonResponse({'success': True, 'message': 'Subgoal deleted successfully'})

@csrf_exempt
@login_required
def create_timeblock(request):
    if request.method == "POST":
        try:
            from .models import Timeblock
            from datetime import datetime, timedelta
            
            print(f"User: {request.user}")  # Debug log
            print(f"User authenticated: {request.user.is_authenticated}")  # Debug log
            
            data = json.loads(request.body)
            print(f"Received timeblock data: {data}")  # Debug log
            
            # Handle both goal-based and standalone timeblocks
            goal = None
            if data.get('goal_id'):
                goal = get_object_or_404(Goal, id=data['goal_id'], user=request.user)
            
            # Create timeblocks based on frequency
            start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
            end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
            frequency = data.get('frequency', 'daily')
            
            timeblocks_created = []
            current_date = start_date
            
            print(f"Creating timeblocks from {start_date} to {end_date}")  # Debug log
            print(f"Frequency: {frequency}")  # Debug log
            
            # Safety check to prevent creating too many timeblocks
            max_days = 365  # Maximum 1 year of timeblocks
            days_in_range = (end_date - start_date).days + 1
            if days_in_range > max_days:
                print(f"Warning: Date range too large ({days_in_range} days), limiting to {max_days} days")
                end_date = start_date + timedelta(days=max_days - 1)
            
            # Parse time strings to time objects once
            start_time_obj = datetime.strptime(data['start_time'], '%H:%M').time()
            end_time_obj = datetime.strptime(data['end_time'], '%H:%M').time()
            
            # Validate that start time is before end time
            if start_time_obj >= end_time_obj:
                return JsonResponse({
                    'success': False,
                    'message': 'Start time must be before end time.'
                }, status=400)
            
            conflicts = []  # Track any time conflicts
            
            while current_date <= end_date:
                should_create = False
                
                if frequency == 'daily':
                    should_create = True
                elif frequency == 'weekdays':
                    should_create = current_date.weekday() < 5  # Mon-Fri
                elif frequency == 'weekends':
                    should_create = current_date.weekday() >= 5  # Sat-Sun
                elif frequency == 'alternate':
                    days_diff = (current_date - start_date).days
                    should_create = days_diff % 2 == 0
                elif frequency == 'custom':
                    custom_days = data.get('custom_days', [])
                    # Convert Sunday (0) to Monday-based weekday system
                    weekday = current_date.weekday()  # Monday=0, Sunday=6
                    # Convert to Sunday-based system for consistency with frontend
                    sunday_based_weekday = (weekday + 1) % 7  # Sunday=0, Monday=1
                    should_create = sunday_based_weekday in custom_days
                
                if should_create:
                    print(f"Checking timeblock for date: {current_date}")  # Debug log
                    
                    # Check for time conflicts on this date
                    existing_timeblocks = Timeblock.objects.filter(
                        user=request.user,
                        date=current_date
                    )
                    
                    has_conflict = False
                    for existing in existing_timeblocks:
                        # Check if times overlap
                        if (start_time_obj < existing.end_time and end_time_obj > existing.start_time):
                            conflicts.append({
                                'date': current_date.isoformat(),
                                'existing_time': f"{existing.start_time.strftime('%I:%M %p')}-{existing.end_time.strftime('%I:%M %p')}",
                                'new_time': f"{start_time_obj.strftime('%I:%M %p')}-{end_time_obj.strftime('%I:%M %p')}",
                                'existing_title': existing.goal.title if existing.goal else existing.task_title
                            })
                            has_conflict = True
                            break
                    
                    if not has_conflict:
                        print(f"Creating timeblock for date: {current_date}")  # Debug log
                        
                        timeblock = Timeblock.objects.create(
                            user=request.user,
                            goal=goal,
                            task_title=data.get('task_title', ''),
                            date=current_date,
                            start_time=start_time_obj,
                            end_time=end_time_obj,
                            is_recurring=True if frequency != 'daily' else False,
                            frequency=frequency,
                            end_date=end_date,
                            custom_days=','.join(map(str, data.get('custom_days', []))) if data.get('custom_days') else ''
                        )
                        timeblocks_created.append({
                            'id': timeblock.id,
                            'date': timeblock.date.isoformat(),
                            'start_time': timeblock.start_time.strftime('%I:%M %p'),
                            'end_time': timeblock.end_time.strftime('%I:%M %p'),
                            'goal_title': goal.title if goal else timeblock.task_title
                        })
                    else:
                        print(f"Skipping date {current_date} due to time conflict")  # Debug log
                
                current_date += timedelta(days=1)
            
            # If there were conflicts, return them in the response
            if conflicts:
                return JsonResponse({
                    'success': False,
                    'message': f'Time conflicts detected on {len(conflicts)} date(s). Please choose different times.',
                    'conflicts': conflicts,
                    'partial_success': len(timeblocks_created) > 0,
                    'created_count': len(timeblocks_created)
                }, status=409)
            
            print(f"Created {len(timeblocks_created)} timeblocks")  # Debug log
            
            return JsonResponse({
                'success': True,
                'timeblocks': timeblocks_created,
                'count': len(timeblocks_created)
            })
        
        except Exception as e:
            print(f"Error creating timeblock: {str(e)}")  # Debug log
            print(f"Request data: {data}")  # Debug log
            import traceback
            traceback.print_exc()
            return JsonResponse({
                'success': False,
                'message': f"Server error: {str(e)}",
                'error_type': type(e).__name__
            }, status=500)
    
    return JsonResponse({'success': False, 'message': 'Invalid request method'}, status=405)

@csrf_exempt
@login_required
def update_timeblock(request, id):
    if request.method == "PUT":
        from .models import Timeblock
        timeblock = get_object_or_404(Timeblock, id=id, user=request.user)
        data = json.loads(request.body)
        
        timeblock.start_time = data.get('start_time', timeblock.start_time)
        timeblock.end_time = data.get('end_time', timeblock.end_time)
        timeblock.task_title = data.get('task_title', timeblock.task_title)
        timeblock.save()
        
        return JsonResponse({'success': True})

@csrf_exempt
@login_required
def delete_timeblock(request, id):
    if request.method == "DELETE":
        from .models import Timeblock
        timeblock = get_object_or_404(Timeblock, id=id, user=request.user)
        timeblock.delete()
        return JsonResponse({'success': True})

@csrf_exempt
@login_required
def get_timeblocks(request):
    if request.method == "GET":
        from .models import Timeblock
        from datetime import datetime
        
        date = request.GET.get('date')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        
        if date:
            # Single date query
            timeblocks = Timeblock.objects.filter(user=request.user, date=date)
        elif start_date and end_date:
            # Date range query
            start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
            timeblocks = Timeblock.objects.filter(
                user=request.user, 
                date__gte=start_date_obj, 
                date__lte=end_date_obj
            ).order_by('date', 'start_time')
        else:
            # All timeblocks
            timeblocks = Timeblock.objects.filter(user=request.user).order_by('date', 'start_time')
        
        timeblocks_data = []
        for tb in timeblocks:
            timeblocks_data.append({
                'id': tb.id,
                'date': tb.date.isoformat(),
                'start_time': tb.start_time.strftime('%I:%M %p'),
                'end_time': tb.end_time.strftime('%I:%M %p'),
                'goal_title': tb.goal.title if tb.goal else tb.task_title,
                'goal_id': tb.goal.id if tb.goal else None,
                'task_title': tb.task_title
            })
        
        return JsonResponse({'timeblocks': timeblocks_data})

@login_required
def goal(request, id):
    goal = get_object_or_404(Goal, id=id, user=request.user)
    return render(request, "goal.html", {"goal": goal})

# Test endpoint to debug timeblock issues
@csrf_exempt
@login_required
def test_timeblock_setup(request):
    try:
        from .models import Timeblock
        from datetime import datetime, date, time
        
        # Test creating a simple timeblock
        test_timeblock = Timeblock(
            user=request.user,
            task_title='Test Task',
            date=date.today(),
            start_time=time(9, 0),
            end_time=time(10, 0)
        )
        test_timeblock.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Timeblock model works correctly',
            'timeblock_id': test_timeblock.id
        })
    except Exception as e:
        import traceback
        return JsonResponse({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        })

