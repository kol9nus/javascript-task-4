'use strict';

/**
 * Сделано задание на звездочку
 * Реализованы методы or и and
 */
exports.isStar = true;

var OPERATORS_PRIORITIES = {
    select: 2,
    format: 3,
    filterIn: 0,
    sortBy: 1,
    limit: 3,
    or: 0,
    and: 0
};
var SORTING_ORDER = {
    asc: 'asc',
    desc: 'desc'
};

/**
 * Запрос к коллекции
 * @param {Array} collection
 * @params {...{priority: number, operator: function}}
 * @returns {Array}
 */
exports.query = function (collection) {
    var queryResult = clone(collection);

    var levelsExecutionQueue = createExecutionQueue(
        [].slice.call(arguments, 1)
    );

    levelsExecutionQueue.forEach(function (priorityLevel) {
        priorityLevel.forEach(function (operator) {
            queryResult = operator(queryResult);
        });
    });

    return queryResult;
};

/**
 * @param {Array} collection - array of objects
 * @returns {Array} - глубокая копия collection
 */
function clone(collection) {

    return collection.reduce(function (copiedCollection, item) {
        return copiedCollection.concat(Object.keys(item).reduce(function (copiedItem, key) {
            copiedItem[key] = item[key];

            return copiedItem;
        }, {}));
    }, []);
}

/**
 * Создать очередь выполнения из функций с приоритетами
 * @param {Array.<{priority: number, operator: function}>} functions - функции и их приоритеты
 * @returns {Array.<Array.<Function>>} очередь выполнения функций
 */
function createExecutionQueue(functions) {
    var executionQueue = [];
    for (var i = 0; i < getAllUniqueValues(OPERATORS_PRIORITIES).length; i++) {
        executionQueue.push([]);
    }

    functions.forEach(function (func) {
        executionQueue[func.priority].push(func.operator);
    });

    return executionQueue;
}

/**
 * Берёт все уникальные значения из object
 * @param {Object} object
 * @returns {Array} - уникальные значения
 */
function getAllUniqueValues(object) {
    return Object.keys(object).reduce(function (uniqueValues, key) {
        if (uniqueValues.indexOf(object[key]) === -1) {
            uniqueValues.push(object[key]);
        }

        return uniqueValues;
    }, []);
}

/**
 * Выбор полей
 * @params {...String}
 * @returns {{priority: number, operator: function}}
 */
exports.select = function () {
    var selectors = [].slice.call(arguments);

    return {
        priority: OPERATORS_PRIORITIES.select,
        operator: function (collection) {
            return collection.reduce(function (copiedCollection, item) {
                return copiedCollection.concat(selectors.reduce(function (copiedItem, key) {
                    if (item.hasOwnProperty(key)) {
                        copiedItem[key] = item[key];
                    }

                    return copiedItem;
                }, {}));
            }, []);
        }
    };
};

/**
 * Фильтрация поля по массиву значений
 * @param {String} property – Свойство для фильтрации
 * @param {Array} values – Доступные значения
 * @returns {{priority: number, operator: function}}
 */
exports.filterIn = function (property, values) {
    return {
        priority: OPERATORS_PRIORITIES.filterIn,
        operator: function (collection) {
            return collection.filter(function (item) {
                return values.indexOf(item[property]) !== -1;
            });
        }
    };
};

/**
 * Сортировка коллекции по полю
 * @param {String} property – Свойство для фильтрации
 * @param {String} order – Порядок сортировки (asc - по возрастанию; desc – по убыванию)
 * @returns {{priority: number, operator: function}}
 */
exports.sortBy = function (property, order) {
    return {
        priority: OPERATORS_PRIORITIES.sortBy,
        operator: function (collection) {
            return collection.sort(function (item1, item2) {
                return order === SORTING_ORDER.asc ? item1[property] > item2[property]
                    : item1[property] < item2[property];
            });
        }
    };
};

/**
 * Форматирование поля
 * @param {String} property – Свойство для фильтрации
 * @param {Function} formatter – Функция для форматирования
 * @returns {{priority: number, operator: function}}
 */
exports.format = function (property, formatter) {
    return {
        priority: OPERATORS_PRIORITIES.format,
        operator: function (collection) {
            collection.forEach(function (item) {
                if (item.hasOwnProperty(property)) {
                    item[property] = formatter(item[property]);
                }
            });

            return collection;
        }
    };
};

/**
 * Ограничение количества элементов в коллекции
 * @param {Number} count – Максимальное количество элементов
 * @returns {{priority: number, operator: function}}
 */
exports.limit = function (count) {
    return {
        priority: OPERATORS_PRIORITIES.limit,
        operator: function (collection) {
            return collection.slice(0, count > 0 ? count : 0);
        }
    };
};

if (exports.isStar) {

    /**
     * Фильтрация, объединяющая фильтрующие функции
     * @star
     * @params {...Function} – Фильтрующие функции
     * @returns {{priority: number, operator: function}}
     */
    exports.or = function () {
        var filters = getFilters([].slice.call(arguments));

        return {
            priority: OPERATORS_PRIORITIES.or,
            operator: function (collection) {
                var filteredCollection = filters.reduce(function (filtered, filter) {
                    return filtered.concat(filter(collection));
                }, []);

                return collection.filter(function (item) {
                    return filteredCollection.indexOf(item) !== -1;
                });
            }
        };
    };

    /**
     * Фильтрация, пересекающая фильтрующие функции
     * @star
     * @params {...Function} – Фильтрующие функции
     * @returns {{priority: number, operator: function}}
     */
    exports.and = function () {
        var filters = getFilters([].slice.call(arguments));

        return {
            priority: OPERATORS_PRIORITIES.and,
            operator: function (collection) {
                return filters.reduce(function (filteredCollection, filter) {
                    return filter(filteredCollection);
                }, collection);
            }
        };
    };
}

/**
 * Вычленяет функцию из массива пар приоритет/функция
 * @param {{priority: number, operator: function}[]} functions
 * @returns {function[]}
 */
function getFilters(functions) {
    return functions.reduce(function (resultFilters, argument) {
        resultFilters.push(argument.operator);

        return resultFilters;
    }, []);
}
