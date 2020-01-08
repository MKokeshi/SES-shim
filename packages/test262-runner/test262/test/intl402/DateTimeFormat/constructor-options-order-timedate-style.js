// Copyright 2018 Igalia, S.L. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: sec-initializedatetimeformat
description: Checks the order of getting options for the DateTimeFormat constructor.
includes: [compareArray.js]
features: [Intl.DateTimeFormat-datetimestyle]
---*/

// To be merged into constructor-options-order.js when the feature is removed.

const expected = [
  // ToDateTimeOptions step 4.
  "weekday", "year", "month", "day",
  // ToDateTimeOptions step 5.
  "hour", "minute", "second",

  // InitializeDateTimeFormat step 4.
  "localeMatcher",
  // InitializeDateTimeFormat step 6.
  "hour12",
  // InitializeDateTimeFormat step 7.
  "hourCycle",
  // InitializeDateTimeFormat step 22.
  "timeZone",
  // InitializeDateTimeFormat step 28.
  "dateStyle",
  // InitializeDateTimeFormat step 30.
  "timeStyle",
  // InitializeDateTimeFormat step 33.
  "weekday",
  "era",
  "year",
  "month",
  "day",
  "hour",
  "minute",
  "second",
  "timeZoneName",
  "formatMatcher",
];

const actual = [];

const options = {
  get dateStyle() {
    actual.push("dateStyle");
    return undefined;
  },

  get day() {
    actual.push("day");
    return "numeric";
  },

  get era() {
    actual.push("era");
    return "long";
  },

  get formatMatcher() {
    actual.push("formatMatcher");
    return "best fit";
  },

  get hour() {
    actual.push("hour");
    return "numeric";
  },

  get hour12() {
    actual.push("hour12");
    return true;
  },

  get hourCycle() {
    actual.push("hourCycle");
    return "h24";
  },

  get localeMatcher() {
    actual.push("localeMatcher");
    return "best fit";
  },

  get minute() {
    actual.push("minute");
    return "numeric";
  },

  get month() {
    actual.push("month");
    return "numeric";
  },

  get second() {
    actual.push("second");
    return "numeric";
  },

  get timeStyle() {
    actual.push("timeStyle");
    return undefined;
  },

  get timeZone() {
    actual.push("timeZone");
    return "UTC";
  },

  get timeZoneName() {
    actual.push("timeZoneName");
    return "long";
  },

  get weekday() {
    actual.push("weekday");
    return "long";
  },

  get year() {
    actual.push("year");
    return "numeric";
  },
};

new Intl.DateTimeFormat("en", options);

assert.compareArray(actual, expected);