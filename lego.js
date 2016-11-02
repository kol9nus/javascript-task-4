'use strict';

/**
 * Сделано задание на звездочку
 * Реализованы методы or и and
 */
exports.isStar = true;

var OPERATORS_PRIORITIES = {
    select: 1,
    format: 3,
    filterIn: 0,
    sortBy: 0,
    limit: 2,
    or: 0,
    and: 0
};

var limit;
var outputtedProperties;
var fieldsFormatters;
var friends;

/**
 * Запрос к коллекции
 * @param {Array} collection
 * @params {...{priority: number, operator: function}}
 * @returns {Array}
 */
exports.query = function (collection) {
    limit = collection.length;
    outputtedProperties = getAllUniqueKeys(collection);
    friends = collection;
    fieldsFormatters = {};

    var bestFriendsIndexes = [];
    for (var i = 0; i < friends.length; i++) {
        bestFriendsIndexes.push(i);
    }

    var executionQueue = createExecutionQueue(
        [].slice.call(arguments, 1)
    );

    // сортировки и фильтры
    executionQueue[0].forEach(function (operator) {
        bestFriendsIndexes = operator(bestFriendsIndexes.slice());
    });

    executionQueue.slice(1).forEach(function (priorityFunctions) {
        priorityFunctions.forEach(function (operator) {
            operator();
        });
    });

    return getBestFriends(bestFriendsIndexes);
};

/**
 * Берёт все уникальные ключи из коллекции объектов
 * @param {Object[]} collection
 * @returns {Array} - уникальные значения
 */
function getAllUniqueKeys(collection) {
    return collection.reduce(function (keys, element) {
        Object.keys(element).forEach(function (key) {
            if (keys.indexOf(key) === -1) {
                keys.push(key);
            }
        });

        return keys;
    }, []);
}

/**
 * Создать очередь выполнения из функций с приоритетами
 * @param {{priority: number, operator: function}[]} functions - функции и их приоритеты
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
    return Object.keys(object).reduce(function (uniqueValues, key, index) {
        if (uniqueValues.indexOf(object[key]) !== index) {
            uniqueValues.push(object[key]);
        }

        return uniqueValues;
    }, []);
}

/**
 * Сгенерировать список лучших друзей
 * @param {Number[]} indexes
 * @returns {Object[]}
 */
function getBestFriends(indexes) {
    return indexes.slice(0, limit).reduce(function (bestFriends, bestFriendIndex) {
        bestFriends.push(
            outputtedProperties.reduce(function (bestFriend, field) {
                bestFriend[field] = fieldsFormatters[field]
                    ? fieldsFormatters[field](friends[bestFriendIndex][field])
                    : friends[bestFriendIndex][field];

                return bestFriend;
            }, {})
        );

        return bestFriends;
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
        operator: function () {
            outputtedProperties = outputtedProperties.filter(function (field) {
                return selectors.indexOf(field) !== -1;
            });
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
        operator: function (friendsIndexes) {
            return friendsIndexes.filter(function (index) {
                return values.some(function (propertyValue) {
                    return friends[index][property] === propertyValue;
                });
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
        operator: function (friendsIndexes) {
            return friendsIndexes.sort(function (friendI1, friendI2) {
                return order === 'asc'
                    ? friends[friendI1][property] > friends[friendI2][property]
                    : friends[friendI1][property] < friends[friendI2][property];
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
        operator: function () {
            fieldsFormatters[property] = formatter;
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
        operator: function () {
            limit = count;
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
        var filters = [].slice.call(arguments).reduce(function (resultFilters, argument) {
            resultFilters.push(argument.operator);

            return resultFilters;
        }, []);

        return {
            priority: OPERATORS_PRIORITIES.or,
            operator: function (friendsIndexes) {
                var resultsOfFilters = filters.reduce(function (results, filter) {
                    return results.concat(filter(friendsIndexes.slice()));
                }, []);

                return friendsIndexes.filter(function (friendIndex) {
                    return resultsOfFilters.indexOf(friendIndex) !== -1;
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
        var filters = [].slice.call(arguments).reduce(function (resultFilters, argument) {
            resultFilters.push(argument.operator);

            return resultFilters;
        }, []);

        return {
            priority: OPERATORS_PRIORITIES.and,
            operator: function (friendsIndexes) {
                filters.forEach(function (filter) {
                    friendsIndexes = filter(friendsIndexes.slice());
                });

                return friendsIndexes;
            }
        };
    };
}
