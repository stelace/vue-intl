/*
 * This file is a modified version of that used in the react-intl package.
 * https://github.com/yahoo/react-intl
 * The license notice below is provided to comply with the terms of the BSD license of that package.
 */

/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *   * Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 *
 *   * Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *
 *   * Neither the name of the Yahoo Inc. nor the
 *     names of its contributors may be used to endorse or promote products
 *     derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL YAHOO! INC. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import IntlRelativeFormat from 'intl-relativeformat';

import {
    dateTimeFormatPropTypes,
    numberFormatPropTypes,
    relativeFormatPropTypes,
    pluralFormatPropTypes
} from './types';

import {
    escape,
    filterProps
} from './utils';

const DATE_TIME_FORMAT_OPTIONS = Object.keys(dateTimeFormatPropTypes);
const NUMBER_FORMAT_OPTIONS    = Object.keys(numberFormatPropTypes);
const RELATIVE_FORMAT_OPTIONS  = Object.keys(relativeFormatPropTypes);
const PLURAL_FORMAT_OPTIONS    = Object.keys(pluralFormatPropTypes);

const RELATIVE_FORMAT_THRESHOLDS = {
    second: 60, // seconds to minute
    minute: 60, // minutes to hour
    hour  : 24, // hours to day
    day   : 30, // days to month
    month : 12  // months to year
};

function updateRelativeFormatThresholds(newThresholds) {
    const {thresholds} = IntlRelativeFormat;
    ({
        second: thresholds.second,
        minute: thresholds.minute,
        hour  : thresholds.hour,
        day   : thresholds.day,
        month : thresholds.month
    } = newThresholds);
}

function getNamedFormat(formats, type, name) {
    let format = formats && formats[type] && formats[type][name];
    if (format) {
        return format;
    }

    if (process.env.NODE_ENV !== 'production') {
        console.error(
            `[Vue Intl] No ${type} format named: ${name}`
        );
    }
}

export function formatDate(config, state, value, options = {}) {
    const {locale, formats} = config;
    const {format}          = options;

    let date            = new Date(value);
    let defaults        = format && getNamedFormat(formats, 'date', format);
    let filteredOptions = filterProps(options, DATE_TIME_FORMAT_OPTIONS, defaults);

    try {
        return state.getDateTimeFormat(locale, filteredOptions).format(date);
    } catch (e) {
        if (process.env.NODE_ENV !== 'production') {
            console.error(
                `[Vue Intl] Error formatting date.\n${e}`
            );
        }
    }

    return String(date);
}

export function formatTime(config, state, value, options = {}) {
    const {locale, formats} = config;
    const {format}          = options;

    let date            = new Date(value);
    let defaults        = format && getNamedFormat(formats, 'time', format);
    let filteredOptions = filterProps(options, DATE_TIME_FORMAT_OPTIONS, defaults);

    // When no formatting options have been specified, default to outputting a
    // time; e.g.: "9:42 AM".
    if (Object.keys(filteredOptions).length === 0) {
        filteredOptions = {
            hour  : 'numeric',
            minute: 'numeric'
        };
    }

    try {
        return state.getDateTimeFormat(locale, filteredOptions).format(date);
    } catch (e) {
        if (process.env.NODE_ENV !== 'production') {
            console.error(
                `[Vue Intl] Error formatting time.\n${e}`
            );
        }
    }

    return String(date);
}

export function formatRelative(config, state, value, options = {}) {
    const {locale, formats} = config;
    const {format}          = options;

    let date            = new Date(value);
    let now             = new Date(options.now);
    let defaults        = format && getNamedFormat(formats, 'relative', format);
    let filteredOptions = filterProps(options, RELATIVE_FORMAT_OPTIONS, defaults);

    // Capture the current threshold values, then temporarily override them with
    // specific values just for this render.
    const oldThresholds = Object.assign({}, IntlRelativeFormat.thresholds);
    updateRelativeFormatThresholds(RELATIVE_FORMAT_THRESHOLDS);

    try {
        return state.getRelativeFormat(locale, filteredOptions).format(date, {
            now: isFinite(now) ? now : state.now()
        });
    } catch (e) {
        if (process.env.NODE_ENV !== 'production') {
            console.error(
                `[Vue Intl] Error formatting relative time.\n${e}`
            );
        }
    } finally {
        updateRelativeFormatThresholds(oldThresholds);
    }

    return String(date);
}

export function formatNumber(config, state, value, options = {}) {
    const {locale, formats} = config;
    const {format}          = options;

    let defaults        = format && getNamedFormat(formats, 'number', format);
    let filteredOptions = filterProps(options, NUMBER_FORMAT_OPTIONS, defaults);

    try {
        return state.getNumberFormat(locale, filteredOptions).format(value);
    } catch (e) {
        if (process.env.NODE_ENV !== 'production') {
            console.error(
                `[Vue Intl] Error formatting number.\n${e}`
            );
        }
    }

    return String(value);
}

export function formatPlural(config, state, value, options = {}) {
    const {locale} = config;

    let filteredOptions = filterProps(options, PLURAL_FORMAT_OPTIONS);

    try {
        return state.getPluralFormat(locale, filteredOptions).format(value);
    } catch (e) {
        if (process.env.NODE_ENV !== 'production') {
            console.error(
                `[Vue Intl] Error formatting plural.\n${e}`
            );
        }
    }

    return 'other';
}

export function formatMessage(config, state, messageDescriptor = {}, values = {}) {
    const {
        locale,
        formats,
        messages,
        defaultLocale,
        defaultFormats
    } = config;

    const {
        id,
        defaultMessage
    } = messageDescriptor;

    // `id` is a required field of a Message Descriptor.
    if (!id) {
        throw new TypeError('[Vue Intl] An `id` must be provided to format a message.');
    }

    const message   = messages && messages[id];
    const hasValues = Object.keys(values).length > 0;

    // Avoid expensive message formatting for simple messages without values. In
    // development messages will always be formatted in case of missing values.
    if (!hasValues && process.env.NODE_ENV === 'production') {
        return message || defaultMessage || id;
    }

    // When debugging in English, show default string to enable hot module reloading
    if (process.env.NODE_ENV === 'development' && defaultMessage && locale === 'en') {
        var formatter = state.getMessageFormat(defaultMessage, locale, formats);
        return formatter.format(values);
    }

    let formattedMessage;

    if (message) {
        try {
            let formatter = state.getMessageFormat(
                message, locale, formats
            );

            formattedMessage = formatter.format(values);
        } catch (e) {
            if (process.env.NODE_ENV !== 'production') {
                console.error(
                    `[Vue Intl] Error formatting message: "${id}" for locale: "${locale}"` +
                    (defaultMessage ? ', using default message as fallback.' : '') +
                    `\n${e}`
                );
            }
        }
    } else {
        if (process.env.NODE_ENV !== 'production') {
            // This prevents warnings from littering the console in development
            // when no `messages` are passed into the <IntlProvider> for the
            // default locale, and a default message is in the source.
            if (!defaultMessage ||
                (locale && locale.toLowerCase() !== defaultLocale.toLowerCase())) {

                console.error(
                    `[Vue Intl] Missing message: "${id}" for locale: "${locale}"` +
                    (defaultMessage ? ', using default message as fallback.' : '')
                );
            }
        }
    }

    if (!formattedMessage && defaultMessage) {
        try {
            let formatter = state.getMessageFormat(
                defaultMessage, defaultLocale, defaultFormats
            );

            formattedMessage = formatter.format(values);
        } catch (e) {
            if (process.env.NODE_ENV !== 'production') {
                console.error(
                    `[Vue Intl] Error formatting the default message for: "${id}"` +
                    `\n${e}`
                );
            }
        }
    }

    if (!formattedMessage) {
        if (process.env.NODE_ENV !== 'production') {
            console.error(
                `[Vue Intl] Cannot format message: "${id}", ` +
                `using message ${message || defaultMessage ? 'source' : 'id'} as fallback.`
            );
        }
    }

    return formattedMessage || message || defaultMessage || id;
}

export function formatHTMLMessage(config, state, messageDescriptor, rawValues = {}) {
    // Process all the values before they are used when formatting the ICU
    // Message string. Since the formatted message might be injected via
    // `innerHTML`, all String-based values need to be HTML-escaped.
    let escapedValues = Object.keys(rawValues).reduce((escaped, name) => {
        let value = rawValues[name];
        escaped[name] = typeof value === 'string' ? escape(value) : value;
        return escaped;
    }, {});

    return formatMessage(config, state, messageDescriptor, escapedValues);
}
