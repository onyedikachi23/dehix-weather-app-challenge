/** @format */
// select initial elements
const inputFormEl = document.querySelector("#location-search-form");
const searchInputEl = inputFormEl.querySelector("#location-search-input");
const errorMessageEl = inputFormEl.querySelector(".error-message");
const httpErrorMessageEl = document.querySelector(".http-error-message");
const forecastDescriptionEls = document.querySelectorAll(
	".forecast-description"
);

// set night or day to the body class
toggleDayNightMode();

// add submit event listener to the search form
inputFormEl.addEventListener("submit", processFormSubmit);

/* functions */
// set Day/Night values according to user local time
function toggleDayNightMode() {
	// get current hours in 24 hrs format from local time
	const currentHours = new Date().getHours();
	let bodyClass;
	let faviconLinkEl = document.querySelector("link[rel~='icon']");
	// if no favicon link exists, create one
	if (!Boolean(faviconLinkEl)) {
		faviconLinkEl = document.createElement("link");
		faviconLinkEl.rel = "icon";
		document.head.appendChild(faviconLinkEl);
	}

	// check time of day and set values based on that
	if (currentHours >= 6 && currentHours < 18) {
		// we're in day time
		bodyClass = "";
		faviconLinkEl.href = "./images/favicon.png";
	} else {
		// we're in night time
		bodyClass = "night";
		faviconLinkEl.href = "./images/favicon-night.png";
	}
	document.body.className = bodyClass;
}

// create a function to process the form disestablish
async function processFormSubmit(event) {
	// prevent the form from refreshing the page
	event.preventDefault();

	// trim whitespace from the input field
	let location = searchInputEl.value.trim();

	// set variable to know if input value is valid
	let inputIsValid = true;

	// create regex to check format of input is valid
	const singleRegionRegex = /^[a-zA-Z]{3,}$/;
	const cityCountryRegex = /^[a-zA-Z]{3,}\s+[a-zA-Z]{3,}$/;

	// check which patterns matches
	if (singleRegionRegex.test(location)) {
		errorMessageEl.classList.add("hide");
		searchInputEl.removeEventListener("input", processFormSubmit);

		// get weather data and display
		const weatherForecast = new WeatherForecast();
		await weatherForecast.fetchWeatherData(location);
		displayWeatherForecast(weatherForecast);
	} else if (cityCountryRegex.test(location)) {
		errorMessageEl.classList.add("hide");
		searchInputEl.removeEventListener("input", processFormSubmit);
		location = location.replace(/\s+/g, ",");
	} else {
		errorMessageEl.classList.remove("hide");
		// add input event listener to input field
		searchInputEl.addEventListener("input", processFormSubmit);
	}
}

// create a class for the weather forecast data
class WeatherForecast {
	calculationTime;
	weatherState;
	temperature;
	pressure;
	humidity;
	visibility;
	windSpeed;
	clouds;
	base;

	isDataLoaded = false;

	async fetchWeatherData(location) {
		try {
			const response = await fetch(
				`https://api.openweathermap.org/data/2.5/weather?q=${location}&units=metric&appid=75e1f6d6e58368987cc10c38be6a1586`
			);

			const weatherData = await response.json();
			// perform error handling for http errors
			if (!response.ok) {
				httpErrorMessageEl.textContent = weatherData.message;
				await animatehttpErrorMessage();
			} else {
				this.initializeWeatherData(weatherData);
			}
		} catch (error) {}
	}

	initializeWeatherData(weatherData) {
		this.calculationTime = this.unixToReadableDate(weatherData.dt);
		this.weatherState = weatherData.weather[0].description;
		this.temperature = `${weatherData.main.temp} °C`;
		this.pressure = `${weatherData.main.pressure}hPa`;
		this.humidity = `${weatherData.main.humidity}%`;
		this.visibility = this.distanceMtoKM(weatherData.visibility);
		this.windSpeed = this.speedMStoKMH(weatherData.wind.speed);
		this.clouds = `${weatherData.clouds.all}%`;
		this.base = weatherData.base;

		this.isDataLoaded = true;
	}

	// this method converts unix timestamp to human readable string
	unixToReadableDate(unixTimeStamp) {
		const date = new Date(unixTimeStamp * 1000);
		return date.toLocaleString();
	}

	// this method converts m/s to km/h only when the speed >= 1000
	speedMStoKMH(speedInMS) {
		if (speedInMS >= 1000) {
			const OneHourInSec = 60 * 60;
			const OneKMInMeters = 1000;
			const speedKMH = speedInMS * (OneKMInMeters / OneHourInSec);
			return `${speedKMH}km/hr`;
		} else {
			return `${speedInMS}m/s`;
		}
	}

	// this method converts meters to kilometers only when the distance >= 1000
	distanceMtoKM(distanceInMs) {
		if (distanceInMs >= 1000) {
			const distanceInKM = distanceInMs / 1000;
			return `${distanceInKM}km`;
		} else {
			return `${distanceInMs}m`;
		}
	}
}

function displayWeatherForecast(weatherData) {
	for (let i = 0; i < forecastDescriptionEls.length; i++) {
		const element = forecastDescriptionEls[i];
		// add matching values
		if (Boolean(weatherData[element.parentElement.id])) {
			element.textContent = weatherData[element.parentElement.id];
		}
	}
}

// create a function to animate http error message element
async function animatehttpErrorMessage() {
	const animations = [
		{ opacity: 1, offset: 0 },
		{ opacity: 0, offset: 1 },
	];

	const animationTimings = {
		duration: 3000,
		iterations: 1,
		easing: "ease-in-out",
	};

	httpErrorMessageEl.classList.remove("hide");
	const animation = httpErrorMessageEl.animate(animations, animationTimings);
	await animation.finished;
	httpErrorMessageEl.classList.add("hide");
}

// load london weather forecast data as default
document.addEventListener("DOMContentLoaded", processFormSubmit);
