from django.urls import path
from . import views

from django.contrib.auth import views as auth_views

urlpatterns = [
    # Landing page
    path('', views.landing, name='landing'),  # Public landing page
    
    # Authentication
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('logout/', auth_views.LogoutView.as_view(next_page='/'), name='logout'),
    
    # Main app
    path('dashboard/', views.index, name='index'),  # Dashboard (authenticated)
    path('goal/<int:id>/', views.goal, name='goal'), # Goal page
    path('create_goal/', views.create_goal, name='create_goal'),
    path('get_goals/', views.get_goals, name='get_goals'),
    path('delete_goal/<int:id>/', views.delete_goal, name='delete_goal'),
    path('create_subgoal/', views.create_subgoal, name='create_subgoal'),
    path('update_subgoal/<int:id>/', views.update_subgoal, name='update_subgoal'),
    path('delete_subgoal/<int:id>/', views.delete_subgoal, name='delete_subgoal'),
    
    # Timeblocks
    path('create_timeblock/', views.create_timeblock, name='create_timeblock'),
    path('update_timeblock/<int:id>/', views.update_timeblock, name='update_timeblock'),
    path('delete_timeblock/<int:id>/', views.delete_timeblock, name='delete_timeblock'),
    path('get_timeblocks/', views.get_timeblocks, name='get_timeblocks'),
    path('test_timeblock_setup/', views.test_timeblock_setup, name='test_timeblock_setup'),
] 
