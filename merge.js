namespace(function () {

    function emptyList(id) {
        return document.createRange().createContextualFragment(
            `<div class='elem-wrapper hlist' id='list-${id}-wrapper'><h2>${id + 1}</h2><i onpointerdown='swap(${id - 1}, ${id})' class='elem-up xi-arrow-up' id='list-${id}-up'></i><i onpointerdown='swap(${id}, ${id + 1})' class='elem-down xi-arrow-down' id='list-${id}-down'></i><input onchange='writeData(${id}, this.value)' class='elem' type='text' id='list-${id}'/><i onpointerdown='deleteData(${id})' class='elem-delete xi-trash-o' id='list-${id}-remove'></i><i onpointerdown='insertData(${id})' class='elem-insert xi-plus-square-o' id='list-${id}-insert'></i></div>`);
    }

    let listlength = 1;
    let list = [''];
    window.onload = function () {
        document.getElementById('list').append(emptyList(0));
        list = importSequence(localStorage.getItem('merge'));
        while (listlength < list.length) {
            document.getElementById('list').append(emptyList(listlength));
            listlength++;
        }
        updateElems();
    }

    function updateElems() {
        for (let i = 0; i < listlength; i++) {
            document.getElementById(`list-${i}`).value = list[i];
        }
        if (list.join('~~').length > 2048) document.getElementById('warning').style.visibility = 'visible';
        else document.getElementById('warning').style.visibility = 'hidden';
        localStorage.setItem('merge', exportSequence(list));
    }

    window.writeData = function (id, value) {
        list[id] = value.replace(/https?:.+?#/, '');
        updateElems();
    }

    window.swap = function (id, id2) {
        if (0 > id || id2 >= listlength) return;
        let temp = list[id];
        list[id] = list[id2];
        list[id2] = temp;
        updateElems();
    }

    window.deleteData = function (id) {
        if (listlength == 1) {
            list[0] = '';
            updateElems();
            return;
        }
        document.getElementById(`list-${listlength - 1}-wrapper`).remove();
        listlength--;
        list.splice(id, 1);
        updateElems();
    }

    window.insertData = function (id) {
        document.getElementById('list').append(emptyList(listlength));
        listlength++;
        list.splice(id + 1, 0, '');
        updateElems();
    }

    window.importSequence2 = function () {
        navigator.clipboard.readText().then(clipText => {
            list = importSequence(clipText.replace(/https?:.+?#/, ''));
            while (listlength < list.length) {
                document.getElementById('list').append(emptyList(listlength));
                listlength++;
            }
            while (listlength > list.length) {
                document.getElementById(`list-${listlength - 1}-wrapper`).remove();
                listlength--;
            }
            updateElems();
        })
    }

    window.exportSequence2 = function (useIDN = false) {
        updateList(); // make sure all versions are the same
        navigator.clipboard.writeText(window.NAME + '/#' + exportSequence(list, useIDN));
    }

    window.updateList = function () {
        let newList = [];
        for (let o of list) {
            if (!o.length) {
                newList.push('');
                continue;
            }
            newList.push(serializePuzzle(deserializePuzzle(o)));
        }
        list = newList;
        document.documentElement.setAttribute('style', '');
        updateElems();
    }

});