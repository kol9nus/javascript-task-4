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
    limit: 4,
    or: 0,
    and: 0
};

var limit;

/**
 * Запрос к коллекции
 * @param {Array} friends
 * @params {...Object.<priority, operator>}
 * @returns {Array}
 */
exports.query = function (friends) {
    var selectedFriends = [];
    clone(friends, selectedFriends);

    limit = undefined;

    var executionQueue = createExecutionQueue(
        [].slice.call(arguments, 1)
    );

    executionQueue.forEach(function (priorityFunctions) {
        priorityFunctions.forEach(function (operator) {
            selectedFriends = operator(selectedFriends);
        });
    });

    return selectedFriends.slice(0, limit);
};

/**
 * deep copy from collection1 to collection2
 * @param {Array} collection1 - array of objects
 * @param {Array} collection2 - array of objects
 */
function clone(collection1, collection2) {
    collection1.forEach(function (element) {
        collection2.push({});
        Object.keys(element).forEach(function (key) {
            collection2[collection2.length - 1][key] = element[key];
        });
    });
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
 * Выбор полей
 * @params {...String}
 * @returns {{priority: number, operator: function}}
 */
exports.select = function () {
    var selectors = [].slice.call(arguments);

    return {
        priority: OPERATORS_PRIORITIES.select,
        operator: function (friends) {
            friends.forEach(function (friend) {
                Object.keys(friend).forEach(function (friendProperty) {
                    if (selectors.indexOf(friendProperty) === -1) {
                        delete friend[friendProperty];
                    }
                });
            });

            return friends;
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
        operator: function (friends) {
            return friends.filter(function (friend) {
                return values.some(function (propertyValue) {
                    return friend[property] === propertyValue;
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
        operator: function (friends) {
            return friends.sort(function (friend1, friend2) {
                return friend1[property] > friend2[property] && order === 'asc' ||
                    friend1[property] < friend2[property] && order === 'desc';
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
        operator: function (friends) {
            friends.forEach(function (friend) {
                if (friend[property]) {
                    friend[property] = formatter(friend[property]);
                }
            });

            return friends;
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
        operator: function (friends) {
            limit = count;

            return friends;
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
            operator: function (friends) {
                return filters.reduce(function (resultFriends, filter) {
                    return resultFriends.concat(
                        filter(friends).filter(function (friend) {
                            return resultFriends.indexOf(friend) === -1;
                        })
                    );
                }, []);
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
            operator: function (friends) {
                filters.forEach(function (filter) {
                    friends = filter(friends);
                });

                return friends;
            }
        };
    };
}
