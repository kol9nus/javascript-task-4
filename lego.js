'use strict';

/**
 * Сделано задание на звездочку
 * Реализованы методы or и and
 */
exports.isStar = true;

var selectedFriendsProperties;

/**
 * Запрос к коллекции
 * @param {Array} friends
 * @params {...Function} – Функции для запроса
 * @returns {Array}
 */
exports.query = function (friends) {
    var selectedFriends = [];
    clone(friends, selectedFriends);

    selectedFriendsProperties = Object.keys(friends[0]);

    var functions = [].slice.call(arguments, 1);
    functions.forEach(function (func) {
        selectedFriends = func(selectedFriends);
    });

    return leaveOnlySelectedProperties(selectedFriends);
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
 * Выбрать только нужные поля
 * @param {Array} friends - array of objects
 * @returns {Array}
 */
function leaveOnlySelectedProperties(friends) {
    return friends.reduce(function (resultFriends, friend) {
        var nextFriend = {};
        selectedFriendsProperties.forEach(function (property) {
            nextFriend[property] = friend[property];
        });
        resultFriends.push(nextFriend);

        return resultFriends;
    }, []);
}

/**
 * Выбор полей
 * @params {...String}
 * @returns {Function}
 */
exports.select = function () {
    var selectors = [].slice.call(arguments);

    return function (friends) {
        selectedFriendsProperties = selectedFriendsProperties.filter(function (selector) {
            return selectors.indexOf(selector) !== -1;
        });

        return friends;
    };
};

/**
 * Фильтрация поля по массиву значений
 * @param {String} property – Свойство для фильтрации
 * @param {Array} values – Доступные значения
 * @returns {Function}
 */
exports.filterIn = function (property, values) {
    return function (friends) {
        return friends.filter(function (friend) {
            return values.some(function (propertyValue) {
                return friend[property] === propertyValue;
            });
        });
    };
};

/**
 * Сортировка коллекции по полю
 * @param {String} property – Свойство для фильтрации
 * @param {String} order – Порядок сортировки (asc - по возрастанию; desc – по убыванию)
 * @returns {Function}
 */
exports.sortBy = function (property, order) {
    return function (friends) {
        return friends.sort(function (friend1, friend2) {
            return friend1[property] > friend2[property] && order === 'asc' ||
                friend1[property] <= friend2[property] && order === 'desc';
        });
    };
};

/**
 * Форматирование поля
 * @param {String} property – Свойство для фильтрации
 * @param {Function} formatter – Функция для форматирования
 * @returns {Function}
 */
exports.format = function (property, formatter) {
    return function (friends) {
        friends.forEach(function (friend) {
            friend[property] = formatter(friend[property]);
        });

        return friends;
    };
};

/**
 * Ограничение количества элементов в коллекции
 * @param {Number} count – Максимальное количество элементов
 * @returns {Function}
 */
exports.limit = function (count) {
    return function (friends) {
        return friends.slice(0, count);
    };
};

if (exports.isStar) {

    /**
     * Фильтрация, объединяющая фильтрующие функции
     * @star
     * @params {...Function} – Фильтрующие функции
     * @returns {Function}
     */
    exports.or = function () {
        var filters = [].slice.call(arguments);

        return function (friends) {
            return filters.reduce(function (resultFriends, filter) {
                return resultFriends.concat(
                    filter(friends).filter(function (friend) {
                        return resultFriends.indexOf(friend) === -1;
                    })
                );
            }, []);
        };
    };

    /**
     * Фильтрация, пересекающая фильтрующие функции
     * @star
     * @params {...Function} – Фильтрующие функции
     * @returns {Function}
     */
    exports.and = function () {
        var filters = [].slice.call(arguments);

        return function (friends) {
            filters.forEach(function (filter) {
                friends = filter(friends);
            });

            return friends;
        };
    };
}
