# 2025-26_website_LL - WASPP (What Are Student's Pedagogical Preferences?)

**WASPP** is a web application designed to collect and analyze data regarding the pedagogical preferences, academic habits, and personal motivations of students (specifically within the CPES/SMD cohort of PSL University).

The platform features an interactive questionnaire, real-time data storage via Google Sheets, and dynamic data visualization using D3.js to compare individual results against the global dataset.

Website link : https://two025-26-website-ll.onrender.com 

## Features

* **Interactive Questionnaire:** A multi-section form capturing demographics, academic profiles, and Likert-scale responses on behavior and motivation.
* **Bilingual Support (Ongoing):** Full English and French support for the questionnaire, with instant language toggling.
* **Real-Time Data Storage:** Serverless backend using Google Apps Script to store responses directly in Google Sheets.
* **Dynamic Visualization:**
  * **General Results:** Aggregated statistics, bar charts for all variables, and linear regression analysis.
  * **Personalized Feedback:** A "Your Results" page that highlights the user's specific answers against the group distribution.


* **Data Integrity:** Validates inputs and filters out test data (IDs starting with "test") from the analysis.
* **Responsive Design (Ongoing):** Optimization for desktop and mobile devices.

## Tech Stack

* **Frontend:** HTML5, CSS3, JavaScript.
* **Visualization:** [D3.js](https://d3js.org/) (Data-Driven Documents).
* **Backend Framework:** Python (Flask).
* **Database / API:** Google Sheets API via Google Apps Script.
* **Deployment:** Render.

## Project Structure

```bash
WASPP/
├── app.py                  # Flask application entry point and routing
├── requirements.txt        # Python dependencies
├── code.gs                 # Google Apps Script (for Google Sheet backend - *not available on Github*)
├── static/
│   ├── css/
│   │   └── style.css       # Main stylesheet
│   ├── js/
│   │   ├── test_interact.js        # Form validation and submission logic
│   │   ├── results_interact.js     # General results visualization & stats
│   │   ├── your_results_interact.js # Personalized results visualization
│   │   └── translations.js         # Dictionary and logic for EN/FR toggle
│   └── images/
│       └── favicon.png
└── templates/
    ├── index.html          # Landing page
    ├── test.html           # The questionnaire
    ├── results.html        # General data analysis dashboard
    └── your_results.html   # User-specific feedback page

```


## Data Analysis Logic

* **N Calculation:** Total number of rows in the dataset.
* **N' Calculation:** Number of "complete" profiles (rows where all mandatory fields are filled).
* **Filtering:** Rows where the `anonymous-id` starts with "test" are automatically excluded from charts and statistics.
* **Regression:** A simple linear regression (Least Squares) is performed client-side to analyze correlations (e.g., Economic Situation vs. Interest).


## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

Personal email adress : lucile.lapray@gmail.com
