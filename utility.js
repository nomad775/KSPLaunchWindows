// JavaScript source code

const pi = Math.atan(1) * 4;
const mu_sun = 1172332800000000000;

const secondsPerMinute = 60;
const secondsPerHour = 60 * secondsPerMinute;
const secondsPerDay = 6 * secondsPerHour;
const secondsPerYear = 426 * secondsPerDay;


function modRev(angleRad) {

    let rev = 2 * pi;
    let rem = ((angleRad % rev) + rev) % rev;

    return rem;
}

function convertDateToSeconds(year, day, hour, minute, isUT) {

    if (isUT) {
        year -= 1
        day -=1
    }

    let seconds = year * secondsPerYear;
    seconds += day * secondsPerDay;
    seconds += hour * secondsPerHour;
    seconds += minute * secondsPerMinute;

    seconds = seconds > 0 ? seconds : 0;

    return seconds;
}

function convertSecondsToUT(seconds) {

    let date = convertSecondsToDateObj(seconds);

    date.y += 1;
    date.d += 1;

    return date;
}

function convertSecondsToDateObj(seconds) {

    let year = Math.trunc(seconds / secondsPerYear);
    let secondsRemaining = seconds % secondsPerYear;

    let day = Math.trunc(secondsRemaining / secondsPerDay);
    secondsRemaining = secondsRemaining % secondsPerDay;

    let hour = Math.trunc(secondsRemaining / secondsPerHour);
    secondsRemaining = secondsRemaining % secondsPerHour;

    let minute = Math.trunc(secondsRemaining / secondsPerMinute);
    let second = secondsRemaining;

    return {
        y: year, d: day, h: hour, m: minute, s: second,
        toString() {
            let minuteStr = minute<10 ? "0" + minute.toString() : minute;
            return `y:${this.y} d:${this.d} ${this.h}:${minuteStr}`;
        }
    };

}
