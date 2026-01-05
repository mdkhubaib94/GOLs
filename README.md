Gamification of Life System
Project Overview

The Gamification of Life System is a Django-based productivity and planning web application designed to help users create long-term goals, break them down into structured subgoals, and schedule focused work sessions using timeblocks displayed on a calendar interface. The project emphasizes accountability, structured execution, and time awareness rather than simple task completion.

This application allows authenticated users to define goals with a clear purpose, incentive (carrot), and consequence (stick). Each goal can be divided into multiple subgoals, including nested subgoals, allowing users to plan work hierarchically. Timeblocks can then be assigned either directly to goals or used as standalone scheduled tasks. These timeblocks support recurring patterns such as daily, weekdays, weekends, alternate days, and custom day selections.

The frontend is implemented using Django templates combined with pure vanilla JavaScript for all dynamic behavior. No frontend frameworks or UI libraries are used. All interactions—such as modal handling, calendar rendering, progress bar updates, nested subgoal rendering, and API communication—are implemented manually using the DOM and the Fetch API. This required careful coordination between Django views, JSON responses, and frontend state management.

The project is designed as a single integrated system rather than isolated features. Goals, subgoals, and timeblocks are all interconnected, and user data is strictly scoped to authenticated users. The application demonstrates both backend data modeling complexity and frontend logic complexity, making it a strong fit for the CS50W final project requirements.

Distinctiveness and Complexity

This project satisfies the distinctiveness and complexity requirements of CS50W in multiple ways.

First, it is not a standard CRUD-based project such as a blog, wiki, or social network. Instead, it focuses on goal execution and time-based planning, a different problem domain that requires more advanced data relationships and logic. Goals can contain multiple subgoals, and subgoals can themselves contain nested subgoals using a self-referential foreign key. This recursive structure introduces complexity in both the database design and the frontend rendering logic.

Second, the project includes a custom-built scheduling system. Timeblocks can be created as one-time or recurring events with multiple frequency options (daily, weekdays, weekends, alternate days, or custom days). When creating recurring timeblocks, the backend dynamically generates multiple database entries across a date range while checking for time conflicts. This logic goes beyond simple form submission and requires careful date and time calculations.

Third, the frontend calendar and progress visualization are implemented entirely in vanilla JavaScript. The calendar supports month navigation, date selection, and dynamic rendering of timeblocks. Progress bars are calculated based on assigned days and completed subgoals. All of this is done without relying on third-party JavaScript frameworks, increasing the technical difficulty of the project.

Finally, the project uses asynchronous communication between the frontend and backend using JSON-based API endpoints. These endpoints support creating, updating, deleting, and fetching goals, subgoals, and timeblocks while enforcing authentication and user ownership. The interaction between Django views, models, and JavaScript fetch calls adds another layer of complexity that distinguishes this project from simpler applications.

File Structure and Contents
Django Models (models.py)

Goal: Stores high-level goals linked to a user, including purpose, carrot, stick, total days, and start date.

Subgoal: Represents tasks under a goal, supports nested subgoals using a self-referential foreign key.

Timeblock: Represents scheduled work sessions, supports recurring logic and multiple frequency types.

Django Views (views.py)

Authentication views for user registration and login.

JSON API endpoints for creating, fetching, updating, and deleting goals, subgoals, and timeblocks.

Recursive helper function to build nested subgoal trees.

Calendar and scheduling logic including conflict detection.

Page-rendering views for the home page and individual goal detail pages.

Templates

index.html: Main dashboard displaying goals, progress bars, and the calendar.

goal.html: Detailed goal view showing subgoals and associated timeblocks.

login.html and register.html: Authentication pages.

landing.html: Public landing page.

Static Files

static/js/main.js: All frontend logic, including rendering UI elements, handling events, calendar navigation, and API communication.

static/css/styles.css: Styling for the entire application.

Other Files

requirements.txt: Lists project dependencies.

README.md: Project documentation.

How to Run the Application

Install dependencies:

pip install -r requirements.txt


Apply database migrations:

python manage.py migrate


Run the development server:

python manage.py runserver


Open a browser and visit:

http://127.0.0.1:8000/

Additional Information

All data in the application is scoped per authenticated user. CSRF protection is handled appropriately for JSON endpoints. The project intentionally avoids Django REST Framework and frontend libraries to demonstrate a strong understanding of Django fundamentals, HTTP requests, relational modeling, and vanilla JavaScript DOM manipulation. The system is designed to be extensible and could be expanded in the future to include analytics, notifications, or mobile responsiveness.