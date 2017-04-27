require('jquery');
require('bootstrap');
require('bootstrap-material-design');
require('vis');
require('ripples');

var modal = require('./modules/loading');

import './custom.css';

const POST = "POST";
const GET = "GET";
const LOADING = "loading";
const ERROR = "error";
const EMPTY = '<i class="fa fa-times" data-toggle="tooltip" title="Нет данных"></i>';
const MANUALY_DISABLED = '<i class="fa fa-ban" data-toggle="tooltip" title="Принудительно выключен"></i>';
const MANUALY_ENABLED = '<i class="fa fa-play" data-toggle="tooltip" title="Принудительно включен"></i>';
const AUTO_ON = '<i class="fa fa-check-circle" data-toggle="tooltip" title="Авто - Включен"></i>';
const AUTO_OFF = '<i class="fa fa-stop" data-toggle="tooltip" title="Авто - Выключен"></i>';

const portString = ":314";
var urlString = "";
var adress = "";
var dat;
var rowIndexTaskTable = 1;
var dow = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];
var dowShrt = ["ВС", "ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ"];
var month = ["xxx", "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
var phCalibrStatus = ["НЕТ", "ДА"];
var clickIndexRow = 0;

var taskTableHdr = ["Задача", "Функция", "Выход", "Вкл", "Выкл", "Ярк.Вкл,%", "Ярк.Выкл,%", "Вход", "Порог"];
var taskTableTxt = [
    ["1", "ТО", "Р1", "17:30", "20:40", "", "", "", ""]
];

function httpPostRequest(messageToSend, messageName, isBinary) {
    var data;
    if (isBinary) {
      data = messageToSend;
    } else {
      data = JSON.stringify(messageToSend);
    }
    var adr = adress + "/" + messageName + "/";

    sendRequest(POST, adr, data);
}

function sendRequest(type, url, data, callback) {
  modal.show(LOADING);
  $.ajax({
      url: url,
      type: type,
      contentType: "text/plain;charset=UTF-8",
      data: data,
      dataType: "text",
      processData: false,
      timeout: 10000,
      success: function(response) {
        if (response && callback)
            callback($.parseJSON(response));
        modal.hide();
      },
      error: function(x, t, m) {
          modal.hide();
          if (t === "timeout") {
              modal.showWithDetails(ERROR, 'errorDetails',
            'Ответ не получен на протяжении 10 секунд. Проверьте адрес. Проверьте WiFi модуль контроллера.');
          } else {
              modal.showWithDetails(ERROR);
          }
      }
  });
}

function httpGetRequest(messageName, callback) {
    var adr = adress + "/" + messageName + "/";
    sendRequest(GET, adr, null, callback);
}
//************************************************************************************************

//EDIT KNOBS TABLE********************************************************************************
function setKnobsTable() {
    var cellData = [];
    var table = document.getElementById('knobsEditTable');

    for (var i = 0; i < table.rows[0].cells.length; i++) {
        cellData.push();
    }

    for (var i = 0; i < table.rows[0].cells.length; i++) {
        var cell = parseInt(table.rows[1].cells[i].childNodes[1].childNodes[0].value);
        if (isNaN(cell) || (cell != 0 && cell != 1 && cell != 2)) {
            alert("Статус кнопки номер " + i + " введен неверно.");
            return;
        } else {
            cellData[i] = cell;
        }
    }

    httpPostRequest(cellData, 'stkb');
}

function getKnobsTable(cellDataR) {
    var table = document.getElementById('knobsEditTable');

    for (var i = 0; i < table.rows[0].cells.length; i++) {
        var select = table.rows[1].cells[i].childNodes[1].childNodes[0];
        select.value = cellDataR[i];
        select.disabled = false;
        changeColor(select);
    }

    document.getElementById('btnPostKnobsValues').disabled = false;
}

//************************************************************************************************

//EDIT FAN TABLE***********************************************************************************
function setFanTable() {
    var cellData = [, ];

    var input = document.getElementById('inFanPower');
    var select = document.getElementById('sltFanMod');

    var power = parseInt(input.value);
    if (isNaN(power) || power < 0 || power > 99) {
        alert("Мощность введена неверно. (0-99)");
        return;
    } else {
        cellData[0] = parseInt(power);
    }

    var mode = parseInt(select.value);
    if (isNaN(mode) || (mode != 0 && mode != 1)) {
        alert("Статус введен неверно.");
        return;
    } else {
        cellData[1] = mode;
    }
    httpPostRequest(cellData, 'stfn');
}

function getFanTable(cellDataR) {

    var input = document.getElementById('inFanPower');
    var select = document.getElementById('sltFanMod');

    input.value = null;
    if (!isNaN(cellDataR[0])) {
        input.value = cellDataR[0];
    }

    select.value = cellDataR[1];
    if (cellDataR[1] == 0) {
        select.style.color = "red";
    } else if (cellDataR[1] == 1) {
        select.style.color = "green";
    }

    select.disabled = false;
    document.getElementById('btnPostFanValues').disabled = false;
}

//*************************************************************************************************

//SEARCH TERMOSENSORS******************************************************************************
function searchTSReq(task) {
    if (task == 'tsrc') {
      httpGetRequest(task, showSensorSearchResults);
      document.getElementById('btnStopSearchTSensor').disabled = false;
    } else {
      httpGetRequest(task);
      document.getElementById('btnStopSearchTSensor').disabled = true;
    }
}

function showSensorSearchResults(data) {
  var table = document.getElementById('termosensTable');
  if (data[0] != -99.9) {
      table.rows[1].cells[0].innerHTML = data[0];
  } else {
      table.rows[1].cells[0].innerHTML = EMPTY;
  }

  if (data[1] != -99.9) {
      table.rows[1].cells[1].innerHTML = data[1];
  } else {
      table.rows[1].cells[1].innerHTML = EMPTY;
  }

  $('#btnStopSearchTSensor').disabled = false;
}

//TEST LEDS*************************************************************************************************
function testLedsReq(task) {
    var adr = adress + "/" + task + "/";

    switch (task) {
        case "gttb":
            document.getElementById("btnEndLedTest").disabled = false;
            document.getElementById("btnStartLedTest").disabled = true;
            break;
        case "gtte":
            document.getElementById("btnEndLedTest").disabled = true;
            document.getElementById("btnStartLedTest").disabled = false;
            break;
   }

    httpGetRequest(adr);
}
//*********************************************************************************************************

//CALIBR PH************************************************************************************************
function calibrPhReq(task) {
    var table = document.getElementById('calibrPhTable');

    var obj = [];
    for (var i = 0; i < 4; i++) {
        obj.push('\xa0');
    }

    switch (task) {
        case "cphb":
            document.getElementById("btnReadyPh4").disabled = false;
            break;
        case "cph4":
            document.getElementById("btnReadyPh4").disabled = true;
            document.getElementById("btnReadyPh7").disabled = false;
            break;
        case "cph7":
            document.getElementById("btnReadyPh7").disabled = true;
            break;
        case "cphe":
            break;

    }

    if (task == 'cph7') {
      httpGetRequest(task, function() {
        obj = JSON.parse(xmlhttp.responseText);
        table.rows[1].cells[0].innerHTML = obj[0];
        table.rows[1].cells[1].innerHTML = obj[1];
        table.rows[1].cells[2].innerHTML = obj[2];
        table.rows[1].cells[3].innerHTML = phCalibrStatus[obj[3]];
      });
    } else {
      httpGetRequest(task)
    }
}
//********************************************************************************************

//EDIT MOON LIGHT******************************************************************************
function setMoonLightTable() {
    var cellData = ["", "", "", ];
    var reqData = [, , , , ];
    var cellDataR = [];
    var pattern = new RegExp(/([01]\d|2[0-3]):?[0-5]\d/);

    var startHour = document.getElementById('inMoonStartHour').value;
    var endHour = document.getElementById('inMoonEndHour').value;
    var mode = parseInt(document.getElementById('inMoonMode').value);


    if (pattern.exec(startHour) == null) {
        alert("Время ВКЛ введено неверно. (ЧЧ:ММ)");
        return;
    }
    cellData[0] = startHour;

    if (pattern.exec(endHour) == null) {
        alert("Время ВЫКЛ введено неверно. (ЧЧ:ММ)");
        return;
    }
    cellData[1] = endHour;

    if (isNaN(mode) || mode < 0 || mode > 1) {
        alert("Статус введен неверно.");
        return;
    }

    reqData[0] = parseInt(cellData[0].substr(0, 2));
    reqData[1] = parseInt(cellData[0].substr(3, 2));
    reqData[2] = parseInt(cellData[1].substr(0, 2));
    reqData[3] = parseInt(cellData[1].substr(3, 2));
    reqData[4] = mode;

    httpPostRequest(reqData, 'stml');
}

function getMoonLightTable(cellDataR) {
    var cellData = ["", "", "", ];

    if (!isNaN(cellDataR[0])) {
        if (cellDataR[0] < 9) {
            cellData[0] = "0" + cellDataR[0] + ":";
        } else {
            cellData[0] = cellDataR[0] + ":";
        }
        if (cellDataR[1] < 9) {
            cellData[0] += "0" + cellDataR[1];
        } else {
            cellData[0] += cellDataR[1];
        }

        if (cellDataR[2] < 9) {
            cellData[1] = "0" + cellDataR[2] + ":";
        } else {
            cellData[1] = cellDataR[2] + ":";
        }
        if (cellDataR[3] < 9) {
            cellData[1] += "0" + cellDataR[3];
        } else {
            cellData[1] += cellDataR[3];
        }

    }

    var startHour = document.getElementById('inMoonStartHour');
    var endHour = document.getElementById('inMoonEndHour');
    var mode = document.getElementById('inMoonMode');
    var saveButton = document.getElementById('bntPostMoonValues');

    startHour.value = cellData[0];
    endHour.value = cellData[1];
    mode.value = cellDataR[4];
    changeColor(mode);

    startHour.disabled = false;
    endHour.disabled = false;
    mode.disabled = false;
    saveButton.disabled = false;
}
//*********************************************************************************************

//EDIT SYSTEM DATE*****************************************************************************
var timeInterVar = setInterval(function() {
    timeSeing();
}, 1000);

function timeSeing() {
    var dat = new Date();
    document.getElementById("dat1").innerHTML = dow[dat.getDay()];
    document.getElementById("dat2").innerHTML = dat.getHours();
    document.getElementById("dat3").innerHTML = dat.getMinutes();
    document.getElementById("dat4").innerHTML = dat.getDate();
    document.getElementById("dat5").innerHTML = dat.getMonth() + 1;
    document.getElementById("dat6").innerHTML = dat.getFullYear();
}

function setDate() {
    var cellData = [];
    var dat = new Date();
    cellData.push(dat.getDay());
    cellData.push(dat.getHours());
    cellData.push(dat.getMinutes());
    cellData.push(dat.getDate());
    cellData.push(dat.getMonth() + 1);
    cellData.push(dat.getFullYear() - 2000);
    httpPostRequest(cellData, 'stdt');
}
//*****************************************************************************

//SHOW DISPLAY*****************************************************************
function getDisplay(cellDataR) {

    var table2 = document.getElementById("displTable2");
    var table3 = document.getElementById("displTable3");

    for (var i = 0; i < 12; i++) {
        var tableCell = document.getElementById("stVal" + i);
        switch (i) {
            case 0:
            case 1:
            case 2:
                if (cellDataR[i] == -99.9) {
                    cellDataR[i] = EMPTY;
                }
                tableCell.innerHTML = cellDataR[i]; //0...11
                tableCell.style.color = "black";
                break;
            default:
                if (cellDataR[i] == 0) {
                    tableCell.innerHTML = MANUALY_DISABLED;
                    tableCell.style.color = "red";
                } else if (cellDataR[i] == 2) {
                    tableCell.innerHTML = AUTO_ON;
                    tableCell.style.color = "green";
                } else if (cellDataR[i] == 1) {
                    tableCell.innerHTML = AUTO_OFF;
                    tableCell.style.color = "red";
                } else if (cellDataR[i] == 3) {
                    tableCell.innerHTML = MANUALY_ENABLED;
                    tableCell.style.color = "blue";
                } else {
                    tableCell.innerHTML = EMPTY;
                    tableCell.style.color = "black";
                }
                break;
        }
    }
    for (var i = 0; i < 6; i++) {
        table2.rows[1].cells[i].innerHTML = cellDataR[i + 12] + "%"; //0...5
    }
    for (var i = 0; i < 6; i++) {
        if (i == 0) {
            table3.rows[1].cells[i].innerHTML = dow[cellDataR[i + 18]];
        } else if (i == 1) {
            table3.rows[1].cells[i].innerHTML = digitToTimeView(cellDataR[i + 18]);
        } else if (i == 2) {
            table3.rows[1].cells[i].innerHTML = digitToTimeView(cellDataR[i + 18]);
        } else if (i == 4) {
            table3.rows[1].cells[i].innerHTML = month[cellDataR[i + 18]];
        } else if (i == 5) {
            table3.rows[1].cells[i].innerHTML = cellDataR[i + 18] + 2000;
        } else {
            table3.rows[1].cells[i].innerHTML = cellDataR[i + 18]; //0...5
        }
    }
}

var timerXhrTask;

function xhrTimer(item) {
    var chk = document.getElementById("GetDisplCheck").checked;
    if (chk == true) {
        if (item.id == "d_1") {
            timerXhrTask = setInterval(function() {
                httpGetRequest('gtdl', getDisplay);
            }, 30000);
        } else {
            clearInterval(timerXhrTask);
        }
    }

}

function getDisplTimer() {
    var chk = document.getElementById("GetDisplCheck").checked;

    if (chk == true) {
        document.getElementById("btnDispl").disabled = true;
        timerXhrTask = setInterval(function() {
            httpGetRequest('gtdl', getDisplay);
        }, 30000);
    } else {
        document.getElementById("btnDispl").disabled = false;
        clearInterval(timerXhrTask);
    }
}

//*****************************************************************************


//EDIT TASK'S TABLE************************************************************
function _enum(list) {
    for (var key in list) {
        list[list[key] = list[key]] = key;
    }
    return Object.freeze(list);
}

var DATAOFFSET = _enum({
    numberLine: 0,
    functionNumber: 1,
    inputNumber: 2,
    timeOnSec: 3,
    timeOnMin: 4,
    timeOnHrs: 5,
    timeOnDow: 6,
    timeOffSec: 7,
    timeOffMin: 8,
    timeOffHrs: 9,
    timeOffDow: 10,
    pwmBegin: 11,
    pwmEnd: 12,
    temperature: 13
});
var NUMBERLINE = _enum({
    P1: 0,
    P2: 1,
    P3: 2,
    P4: 3,
    P5: 4,
    P6: 5,
    P7: 6,
    P8: 7,
    C1: 9,
    C2: 10,
    C3: 11,
    C4: 12,
    C5: 13,
    C6: 14,
    BP: 15
});
var FUNCTION = _enum({
		TC : 0,
		TM : 1,
		TO : 2,
		HT : 3,
		OT : 4,
		TH : 5,

		CO : 7,
		TK : 8,
		UV : 9
	});
var TASKTABLE = _enum({
    NUMBER: 0,
    FUNCTION: 1,
    OUT: 2,
    TIMEON: 3,
    TIMEOFF: 4,
    PWMON: 5,
    PWMOFF: 6,
    INPUT: 7,
    TRESH: 8
});
var INPUT = _enum({
    T1: 0,
    T2: 1,
    X: 2,
    OPEN: 3,
    SHRT: 4,
    PH: 5
});

//CREATE TASK TABLE************************************************************
function populateTable(table, rows, cells, content) {
    var is_func = (typeof content === 'function');
    if (!table)
        table = document.createElement('table');
    table.className = "table table-bordered table-striped table-hover";
    table.id = "taskTable";

    var header = table.createTHead();
    var rowh = header.insertRow(0);
    for (var i = 0; i < cells; ++i) {
        var cell = rowh.insertCell(i);
        cell.outerHTML = "<th>" + taskTableHdr[i] + "</th>";
    }

    var body = table.createTBody();
    for (var i = 0; i < rows; ++i) {
        var row = body.insertRow(i);
        row.onclick = function() {
            rowIndexTaskTable = this.rowIndex;

            if (clickIndexRow != 0) {
                if (clickIndexRow % 2 != 0) {
                    table.rows[clickIndexRow].style.backgroundColor = "#fff";
                    table.rows[clickIndexRow].style.color = "black";
                } else {
                    table.rows[clickIndexRow].style.backgroundColor = "#d0d0d0";
                    table.rows[clickIndexRow].style.color = "black";

                }
            }

            this.style.backgroundColor = "black";
            this.style.color = "white";
            clickIndexRow = this.rowIndex;

            var tableEdit = document.getElementById('taskEditTable');
            for (var i = 0; i < cells; i++) {
                tableEdit.rows[1].cells[i].childNodes[1].childNodes[0].value = this.cells[i].innerHTML;
            }
        }

        for (var j = 0; j < cells; ++j) {
            var cell = row.insertCell(j);
            var text = content[i][j];
            cell.innerHTML = text;
        }
    }
    return table;
}
//ADD ROW TO TASKTABLE********************************************************
function addRow(tableID, rowNumber, content) {
    var table = document.getElementById(tableID);

    var rowCount = table.rows.length;
    var cellCount = table.rows[0].cells.length;

    if (rowCount >= 100) {
        return;
    }
    var row = table.insertRow(rowCount);
    row.onclick = function() {
        rowIndexTaskTable = this.rowIndex;

        if (clickIndexRow != 0) {
            if (clickIndexRow % 2 != 0) {
                table.rows[clickIndexRow].style.backgroundColor = "#fff";
                table.rows[clickIndexRow].style.color = "black";
            } else {
                table.rows[clickIndexRow].style.backgroundColor = "#d0d0d0";
                table.rows[clickIndexRow].style.color = "black";
            }
        }

        this.style.backgroundColor = "black";
        this.style.color = "white";
        clickIndexRow = this.rowIndex;

        var tableEdit = document.getElementById('taskEditTable');
        for (var i = 0; i < cellCount; i++) {
            tableEdit.rows[1].cells[i].childNodes[1].childNodes[0].value = this.cells[i].innerHTML;
        }


    }

    for (var j = 0; j < cellCount; j++) {
        var cellTd = row.insertCell(j);
        var tableEdit = document.getElementById("taskEditTable");

        if (j == 0) {
            cellTd.innerHTML = rowCount; // 0 - headline
            tableEdit.rows[1].cells[0].childNodes[1].childNodes[0].value = rowCount;
        } else {
            if (rowNumber != undefined) {
                cellTd.innerHTML = table.rows[rowNumber].cells[j].innerHTML;
                tableEdit.rows[1].cells[j].childNodes[1].childNodes[0].value = table.rows[rowNumber].cells[j].innerHTML;
            } else {
                cellTd.innerHTML = table.rows[rowCount - 1].cells[j].innerHTML;
            }
        }
    }
    rowIndexTaskTable = rowCount;
}

//DELETE ROW FROM TASKTABLE********************************************************
function delRow(tableId, row) {
    var table = document.getElementById(tableId);
    var tableEdit = document.getElementById("taskEditTable");
    var cellCount = table.rows[0].cells.length;

    if ((table.rows.length > 2)) { // 1- headline 2- first task

        table.deleteRow(row);
        for (var i = 1; i < table.rows.length; i++) {
            table.rows[i].cells[0].innerHTML = i;
            if ((i == clickIndexRow) && (clickIndexRow != rowIndexTaskTable)) {
                continue;
            }
            if (i % 2 != 0) {
                table.rows[i].style.backgroundColor = "#fff";
                table.rows[i].style.color = "black";
            } else {
                table.rows[i].style.backgroundColor = "#d0d0d0";
                table.rows[i].style.color = "black";
            }

        }

        if (rowIndexTaskTable >= table.rows.length) {
            rowIndexTaskTable = row = row - 1;
        }

        if (clickIndexRow >= table.rows.length) {
            clickIndexRow = 0;
        }

        for (var i = 0; i < cellCount; i++) {
            tableEdit.rows[1].cells[i].childNodes[1].childNodes[0].value = table.rows[row].cells[i].innerHTML;
        }
    }

}

//CREATE EDITOR TABLE************************************************************
function populateEditorTable(table, rows, cells, content) {
    var is_func = (typeof content === 'function');
    if (!table)
        table = document.createElement('table');
    table.className = "scrTab";
    table.id = "taskEditTable";
    var rowh = document.createElement('tr');
    for (var i = 0; i < cells; ++i) {
        rowh.appendChild(document.createElement('th'));
        rowh.cells[i].appendChild(document.createTextNode(taskTableHdr[i]));
    }

    table.appendChild(rowh);
    for (var i = 0; i < rows; ++i) {

        var row = document.createElement('tr');
        for (var j = 0; j < cells; ++j) {
            var elInput = document.createElement('input');
            elInput.setAttribute("type", "text");
            elInput.className = "inEditTbl";
            if (j == 0) {
                elInput.setAttribute("readonly", "readonly");
            }
            var elTd = document.createElement('td');
            elTd.appendChild(elInput);
            row.appendChild(elTd);
        }
        table.appendChild(row);
    }
    return table;
}

//EDIT ROW TO TASKTABLE********************************************************
function editRow(tableID, cells, content) {
    var table = document.getElementById(tableID);
    var tableEdit = document.getElementById('taskEditTable');

    if (tableEdit.rows[1].cells[TASKTABLE.NUMBER].childNodes[1].value == "") { //empty input
        alert("Ошибка: Невыбрана Задача.");
        return;
    }
    switch (tableEdit.rows[1].cells[TASKTABLE.FUNCTION].childNodes[1].childNodes[0].value) {
        case "ТО":
        case "ТС":
        case "ТМ":
        case "НТ":
        case "ОТ":
        case "ТН":
        case "СО":
        case "ЦВ":
        case "УВ":
            break;
        default:
            alert("Ошибка: Неверно введена Функция");
            return;
    }
    switch (tableEdit.rows[1].cells[TASKTABLE.OUT].childNodes[1].childNodes[0].value) {
        case "Р1":
        case "Р2":
        case "Р3":
        case "Р4":
        case "Р5":
        case "Р6":
        case "Р7":
        case "Р8":
        case "С1":
        case "С2":
        case "С3":
        case "С4":
        case "С5":
        case "С6":
        case "ВР":
            break;
        default:
            alert("Ошибка: Неверно введен Выход");
            return;
    }

    switch (tableEdit.rows[1].cells[TASKTABLE.OUT].childNodes[1].childNodes[0].value) {
        case "Р1":
        case "Р2":
        case "Р3":
        case "Р4":
        case "Р5":
        case "Р6":
        case "Р7":
        case "Р8":
        case "ВР":
            tableEdit.rows[1].cells[TASKTABLE.PWMON].childNodes[1].childNodes[0].value = '';
            tableEdit.rows[1].cells[TASKTABLE.PWMOFF].childNodes[1].childNodes[0].value = '';
            break;

        case "С1":
        case "С2":
        case "С3":
        case "С4":
        case "С5":
        case "С6":
            switch (tableEdit.rows[1].cells[TASKTABLE.FUNCTION].childNodes[1].childNodes[0].value) {
                case "УВ":
                case "НТ":
                case "ОТ":
                case "ЦВ":
                    alert("Ошибка: Функция не соответствует Выходу");
                    return;
                    break;
            }
            var pwmS = parseInt(tableEdit.rows[1].cells[TASKTABLE.PWMON].childNodes[1].childNodes[0].value);
            if (pwmS < 0 || pwmS > 99 || isNaN(pwmS)) {
                alert("Ошибка: Ярк.Вкл вне диапазона");
                return;
            }
            var pwmE = parseInt(tableEdit.rows[1].cells[TASKTABLE.PWMON].childNodes[1].childNodes[0].value);
            if (pwmE < 0 || pwmE > 99 || isNaN(pwmE)) {
                alert("Ошибка: Ярк.Выкл вне диапазона");
                return;
            }
            tableEdit.rows[1].cells[TASKTABLE.INPUT].childNodes[1].childNodes[0].value = '';
            tableEdit.rows[1].cells[TASKTABLE.TRESH].childNodes[1].childNodes[0].value = '';
            break;
    }

    switch (tableEdit.rows[1].cells[TASKTABLE.FUNCTION].childNodes[1].childNodes[0].value) {
        case "ТС":
            {
                var date = tableEdit.rows[1].cells[TASKTABLE.TIMEON].childNodes[1].childNodes[0].value;
                var pattern = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
                if (!pattern.test(date)) {
                    alert("Дата Вкл введена неверно. (ЧЧ:ММ)");
                    return;
                }
                date = tableEdit.rows[1].cells[TASKTABLE.TIMEOFF].childNodes[1].childNodes[0].value;
                pattern = /^[0-9][0-9]$/;
                if (!pattern.test(date)) {
                    alert("Дата Выкл введена неверно. (СС)");
                    return;
                }
                tableEdit.rows[1].cells[TASKTABLE.INPUT].childNodes[1].childNodes[0].value = '';
                tableEdit.rows[1].cells[TASKTABLE.TRESH].childNodes[1].childNodes[0].value = '';
            }
            break;
        case "ТМ":
            {
                var date = tableEdit.rows[1].cells[TASKTABLE.TIMEON].childNodes[1].childNodes[0].value;
                var pattern = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
                if (!pattern.test(date)) {
                    alert("Дата Вкл введена неверно. (ЧЧ:ММ)");
                    return;
                }
                date = tableEdit.rows[1].cells[TASKTABLE.TIMEOFF].childNodes[1].childNodes[0].value;
                pattern = /^[0-9][0-9]$/;
                if (!pattern.test(date)) {
                    alert("Дата Выкл введена неверно. (MM)");
                    return;
                }
                tableEdit.rows[1].cells[TASKTABLE.INPUT].childNodes[1].childNodes[0].value = '';
                tableEdit.rows[1].cells[TASKTABLE.TRESH].childNodes[1].childNodes[0].value = '';
            }
            break;
        case "ТО":
            var date = tableEdit.rows[1].cells[TASKTABLE.TIMEON].childNodes[1].childNodes[0].value;
            var pattern = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
            if (!pattern.test(date)) {
                alert("Дата Вкл введена неверно. (ЧЧ:ММ)");
                return;
            }
            date = tableEdit.rows[1].cells[TASKTABLE.TIMEOFF].childNodes[1].childNodes[0].value;
            pattern = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
            if (!pattern.test(date)) {
                alert("Дата Выкл введена неверно. (ЧЧ:MM)");
                return;
            }
            //tableEdit.rows[1].cells[TASKTABLE.INPUT].childNodes[0].value = '';
            tableEdit.rows[1].cells[TASKTABLE.INPUT].childNodes[1].childNodes[0].value = '';
            tableEdit.rows[1].cells[TASKTABLE.TRESH].childNodes[1].childNodes[0].value = '';
            //console.log(tableEdit.rows[1].cells[TASKTABLE.INPUT].childNodes);
            break;
        case "ТН":
            {
                var date = tableEdit.rows[1].cells[TASKTABLE.TIMEON].childNodes[1].childNodes[0].value;
                var pattern = /^(ПН |ВТ |СР |ЧТ |ПТ |СБ |ВС )?([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
                if (!pattern.test(date)) {
                    alert("Дата Вкл введена неверно. (ДН ЧЧ:ММ)");
                    return;
                }
                date = tableEdit.rows[1].cells[TASKTABLE.TIMEOFF].childNodes[1].childNodes[0].value;
                pattern = /^[0-9][0-9]$/;
                if (!pattern.test(date)) {
                    alert("Дата Выкл введена неверно. (СС)");
                    return;
                }
                tableEdit.rows[1].cells[TASKTABLE.INPUT].childNodes[1].childNodes[0].value = '';
                tableEdit.rows[1].cells[TASKTABLE.TRESH].childNodes[1].childNodes[0].value = '';
            }
            break;
        case "ЦВ":
            {
                var date = tableEdit.rows[1].cells[TASKTABLE.TIMEON].childNodes[1].childNodes[0].value;
                var pattern = /^[0-9][0-9]$/;

                if (!pattern.test(date)) {
                    alert("Дата Вкл введена неверно. (СС 00-99)");
                    return;
                }
                var dateOn = parseInt(date);
                date = tableEdit.rows[1].cells[TASKTABLE.TIMEOFF].childNodes[1].childNodes[0].value;
                pattern = /^[0-9][0-9]$/;
                if (!pattern.test(date)) {
                    alert("Дата Выкл введена неверно. (СС 00-99)");
                    return;
                }
                var dateOff = parseInt(date);
                if (dateOff >= dateOn) {
                    alert("Период Вкл должен быть больше времени Выкл. (СС 00-99)");
                    return;
                }
                tableEdit.rows[1].cells[TASKTABLE.INPUT].childNodes[1].value = '';
                tableEdit.rows[1].cells[TASKTABLE.TRESH].childNodes[1].value = '';
            }
            break;
        case "НТ":
        case "ОТ":
            {
                var tresh = parseFloat(tableEdit.rows[1].cells[TASKTABLE.TRESH].childNodes[1].value);
                if (tresh < 0 || tresh > 99 || isNaN(tresh)) {
                    alert("Ошибка: Порог задан вне диапазона.(0-99)");
                    return;
                }
                switch (tableEdit.rows[1].cells[TASKTABLE.INPUT].childNodes[1].value) {
                    case "t1":
                    case "t2":
                    case "X":
                        break;
                    default:
                        alert("Ошибка: Неверно введен Вход. (Т1,Т2)");
                        return;
                }
                tableEdit.rows[1].cells[TASKTABLE.PWMON].childNodes[1].value = '';
                tableEdit.rows[1].cells[TASKTABLE.PWMOFF].childNodes[1].value = '';
                tableEdit.rows[1].cells[TASKTABLE.TIMEON].childNodes[1].value = '';
                tableEdit.rows[1].cells[TASKTABLE.TIMEOFF].childNodes[1].value = '';
            }
            break;
        case "СО":
            {
                var tresh = parseFloat(tableEdit.rows[1].cells[TASKTABLE.TRESH].childNodes[1].value);
                if (tresh < 0 || tresh > 9.9 || isNaN(tresh)) {
                    alert("Ошибка: Порог задан вне диапазона.(0-9.9)");
                    return;
                }
                tableEdit.rows[1].cells[TASKTABLE.PWMON].childNodes[1].value = '';
                tableEdit.rows[1].cells[TASKTABLE.PWMOFF].childNodes[1].value = '';
                tableEdit.rows[1].cells[TASKTABLE.TIMEON].childNodes[1].value = '';
                tableEdit.rows[1].cells[TASKTABLE.TIMEOFF].childNodes[1].value = '';
                tableEdit.rows[1].cells[TASKTABLE.INPUT].childNodes[1].value = '';
            }
            break;
        case "УВ":
            var date = tableEdit.rows[1].cells[TASKTABLE.TIMEOFF].childNodes[1].childNodes[0].value;
            var pattern = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
            if (!pattern.test(date)) {
                alert("Дата Выкл введена неверно. (ЧЧ:ММ)");
                return;
            }
            switch (tableEdit.rows[1].cells[TASKTABLE.INPUT].childNodes[1].value) {
                case "З":
                case "Р":
                    break;
                default:
                    alert("Ошибка: Неверно введен Вход. (З,Р)");
                    return;
            }
            tableEdit.rows[1].cells[TASKTABLE.TIMEON].childNodes[1].value = '';
            tableEdit.rows[1].cells[TASKTABLE.PWMON].childNodes[1].value = '';
            tableEdit.rows[1].cells[TASKTABLE.PWMOFF].childNodes[1].value = '';
            tableEdit.rows[1].cells[TASKTABLE.TRESH].childNodes[1].value = '';

            break;
    }

    for (var j = 0; j < cells; j++) {
        table.rows[rowIndexTaskTable].cells[j].innerHTML = tableEdit.rows[1].cells[j].childNodes[1].childNodes[0].value;
        //content[rowIndexTaskTable - 1][j] = tableEdit.rows[1].cells[j].childNodes[1].childNodes[0].value;
    }

    //console.log(taskTableTxt);
}

function setTaskTable() {
    var taskTable = document.getElementById("taskTable");
    var tableRowsCount = taskTable.rows.length - 1; // - table's header
    var tableCellsCount = taskTable.rows[0].cells.length;
    var deviceTaskStructByteCount = 15;
    var bufferTaskTable = new ArrayBuffer(deviceTaskStructByteCount * tableRowsCount);

    //names from device's task c struct
    for (var i = 0; i < tableRowsCount; i++) {
        var dataView = new DataView(bufferTaskTable, i * deviceTaskStructByteCount, deviceTaskStructByteCount);
        var cellOut = taskTable.rows[i + 1].cells[TASKTABLE.OUT].innerHTML; //.childNodes[0].value;
        var cellFunction = taskTable.rows[i + 1].cells[TASKTABLE.FUNCTION].innerHTML; //childNodes[0].value;
        var cellTimeOn = taskTable.rows[i + 1].cells[TASKTABLE.TIMEON].innerHTML; //childNodes[0].value;
        var cellTimeOff = taskTable.rows[i + 1].cells[TASKTABLE.TIMEOFF].innerHTML; //childNodes[0].value;
        var cellPwmOn = taskTable.rows[i + 1].cells[TASKTABLE.PWMON].innerHTML; //childNodes[0].value;
        var cellPwmOff = taskTable.rows[i + 1].cells[TASKTABLE.PWMOFF].innerHTML; //childNodes[0].value;
        var cellInput = taskTable.rows[i + 1].cells[TASKTABLE.INPUT].innerHTML; //childNodes[0].value;
        var cellTresh = taskTable.rows[i + 1].cells[TASKTABLE.TRESH].innerHTML; //childNodes[0].value;

        switch (cellOut) { //numberline
            case 'Р1':
                dataView.setUint8(DATAOFFSET.numberLine, NUMBERLINE.P1);
                break;
            case 'Р2':
                dataView.setUint8(DATAOFFSET.numberLine, NUMBERLINE.P2);
                break;
            case 'Р3':
                dataView.setUint8(DATAOFFSET.numberLine, NUMBERLINE.P3);
                break;
            case 'Р4':
                dataView.setUint8(DATAOFFSET.numberLine, NUMBERLINE.P4);
                break;
            case 'Р5':
                dataView.setUint8(DATAOFFSET.numberLine, NUMBERLINE.P5);
                break;
            case 'Р6':
                dataView.setUint8(DATAOFFSET.numberLine, NUMBERLINE.P6);
                break;
            case 'Р7':
                dataView.setUint8(DATAOFFSET.numberLine, NUMBERLINE.P7);
                break;
            case 'Р8':
                dataView.setUint8(DATAOFFSET.numberLine, NUMBERLINE.P8);
                break;
            case 'С1':
                dataView.setUint8(DATAOFFSET.numberLine, NUMBERLINE.C1);
                break;
            case 'С2':
                dataView.setUint8(DATAOFFSET.numberLine, NUMBERLINE.C2);
                break;
            case 'С3':
                dataView.setUint8(DATAOFFSET.numberLine, NUMBERLINE.C3);
                break;
            case 'С4':
                dataView.setUint8(DATAOFFSET.numberLine, NUMBERLINE.C4);
                break;
            case 'С5':
                dataView.setUint8(DATAOFFSET.numberLine, NUMBERLINE.C5);
                break;
            case 'С6':
                dataView.setUint8(DATAOFFSET.numberLine, NUMBERLINE.C6);
                break;
            case 'ВР':
                dataView.setUint8(DATAOFFSET.numberLine, NUMBERLINE.BP);
                break;
        } //numberline

        switch (cellFunction) {
            case 'ТО':
                dataView.setUint8(DATAOFFSET.functionNumber, FUNCTION.TO);
                break;
            case 'ТС':
                dataView.setUint8(DATAOFFSET.functionNumber, FUNCTION.TC);
                break;
            case 'ТМ':
                dataView.setUint8(DATAOFFSET.functionNumber, FUNCTION.TM);
                break;
            case 'НТ':
                dataView.setUint8(DATAOFFSET.functionNumber, FUNCTION.HT);
                break;
            case 'ОТ':
                dataView.setUint8(DATAOFFSET.functionNumber, FUNCTION.OT);
                break;
            case 'ТН':
                dataView.setUint8(DATAOFFSET.functionNumber, FUNCTION.TH);
                break;
            case 'СО':
                dataView.setUint8(DATAOFFSET.functionNumber, FUNCTION.CO);
                break;
            case 'ЦВ':
                dataView.setUint8(DATAOFFSET.functionNumber, FUNCTION.TK);
                break;
            case 'УВ':
                dataView.setUint8(DATAOFFSET.functionNumber, FUNCTION.UV);
                break;
        } //functionNumber

        if (!(cellTimeOn == "")) {
            switch (cellFunction) {
                case 'ТО':
                    {
                        var hours = parseInt(cellTimeOn.substr(0, 2));
                        var minutes = parseInt(cellTimeOn.substr(3, 2));
                        dataView.setUint8(DATAOFFSET.timeOnHrs, hours);
                        dataView.setUint8(DATAOFFSET.timeOnMin, minutes);
                    }
                    break;
                case 'ТС':
                    {
                        var hours = parseInt(cellTimeOn.substr(0, 2));
                        var minutes = parseInt(cellTimeOn.substr(3, 2));
                        dataView.setUint8(DATAOFFSET.timeOnHrs, hours);
                        dataView.setUint8(DATAOFFSET.timeOnMin, minutes);
                    }
                    break;
                case 'ТМ':
                    {
                        var hours = parseInt(cellTimeOn.substr(0, 2));
                        var minutes = parseInt(cellTimeOn.substr(3, 2));
                        dataView.setUint8(DATAOFFSET.timeOnHrs, hours);
                        dataView.setUint8(DATAOFFSET.timeOnMin, minutes);
                    }
                    break;
                case 'ТН':
                    {
                        var dow = cellTimeOn.substr(0, 2);
                        switch (dow) {
                            case 'ВС':
                                dow = 0;
                                break;
                            case 'ПН':
                                dow = 1;
                                break;
                            case 'ВТ':
                                dow = 2;
                                break;
                            case 'СР':
                                dow = 3;
                                break;
                            case 'ЧТ':
                                dow = 4;
                                break;
                            case 'ПТ':
                                dow = 5;
                                break;
                            case 'СБ':
                                dow = 6;
                                break;

                        }
                        var hours = parseInt(cellTimeOn.substr(3, 2));
                        var minutes = parseInt(cellTimeOn.substr(6, 2));
                        dataView.setUint8(DATAOFFSET.timeOnDow, dow);
                        dataView.setUint8(DATAOFFSET.timeOnHrs, hours);
                        dataView.setUint8(DATAOFFSET.timeOnMin, minutes);
                    }
                    break;
                case 'ЦВ':
                    var seconds = parseInt(cellTimeOn);
                    var minutes = parseInt(seconds / 60);
                    seconds = seconds % 60;
                    dataView.setUint8(DATAOFFSET.timeOnMin, minutes);
                    dataView.setUint8(DATAOFFSET.timeOnSec, seconds);
                    break;
            }

        }
        if (!(cellTimeOff == "")) {
            switch (cellFunction) {
                case 'ТО':
                    var hours = parseInt(cellTimeOff.substr(0, 2));
                    var minutes = parseInt(cellTimeOff.substr(3, 2));
                    dataView.setUint8(DATAOFFSET.timeOffHrs, hours);
                    dataView.setUint8(DATAOFFSET.timeOffMin, minutes);
                    break;
                case 'ТС':
                    var seconds = parseInt(cellTimeOff);
                    var hours = parseInt(cellTimeOn.substr(0, 2));
                    var minutes = parseInt(cellTimeOn.substr(3, 2));
                    seconds = seconds + minutes * 60 + hours * 3600;
                    seconds = seconds % (24 * 3600);
                    hours = parseInt(seconds / 3600);
                    seconds = seconds % 3600;
                    minutes = parseInt(seconds / 60);
                    seconds = seconds % 60;
                    dataView.setUint8(DATAOFFSET.timeOffHrs, hours);
                    dataView.setUint8(DATAOFFSET.timeOffMin, minutes);
                    dataView.setUint8(DATAOFFSET.timeOffSec, seconds);
                    break;
                case 'ТМ':
                    var seconds = parseInt(cellTimeOff) * 60;
                    var hours = parseInt(cellTimeOn.substr(0, 2));
                    var minutes = parseInt(cellTimeOn.substr(3, 2));
                    seconds = seconds + minutes * 60 + hours * 3600;
                    seconds = seconds % (24 * 3600);
                    hours = parseInt(seconds / 3600);
                    seconds = seconds % 3600;
                    minutes = parseInt(seconds / 60);
                    //seconds=seconds%60;
                    dataView.setUint8(DATAOFFSET.timeOffHrs, hours);
                    dataView.setUint8(DATAOFFSET.timeOffMin, minutes);
                    //dataView.setUint8(DATAOFFSET.timeOffSec, seconds);
                    break;
                case 'ТН':
                    var seconds = parseInt(cellTimeOff);

                    var dow = cellTimeOn.substr(0, 2);
                    switch (dow) {
                        case 'ВС':
                            dow = 0;
                            break;
                        case 'ПН':
                            dow = 1;
                            break;
                        case 'ВТ':
                            dow = 2;
                            break;
                        case 'СР':
                            dow = 3;
                            break;
                        case 'ЧТ':
                            dow = 4;
                            break;
                        case 'ПТ':
                            dow = 5;
                            break;
                        case 'СБ':
                            dow = 6;
                            break;

                    }
                    var hours = parseInt(cellTimeOn.substr(3, 2));
                    var minutes = parseInt(cellTimeOn.substr(6, 2));
                    seconds = seconds + minutes * 60 + hours * 3600 + (dow) * 24 * 3600;
                    seconds = seconds % (24 * 3600 * 7);
                    dow = parseInt(seconds / 3600 / 24);
                    seconds = seconds % (3600 * 24);
                    hours = seconds / 3600;
                    seconds = seconds % 3600;
                    minutes = seconds / 60;
                    seconds = seconds % 60;
                    dataView.setUint8(DATAOFFSET.timeOffDow, dow);
                    dataView.setUint8(DATAOFFSET.timeOffHrs, hours);
                    dataView.setUint8(DATAOFFSET.timeOffMin, minutes);
                    dataView.setUint8(DATAOFFSET.timeOffSec, seconds);
                    break;
                case 'ЦВ':
                    var seconds = parseInt(cellTimeOff);
                    var minutes = parseInt(seconds / 60);
                    seconds = seconds % 60;
                    dataView.setUint8(DATAOFFSET.timeOffMin, minutes);
                    dataView.setUint8(DATAOFFSET.timeOffSec, seconds);

                    break;
                case 'УВ':
                    var hours = parseInt(cellTimeOff.substr(0, 2));
                    var minutes = parseInt(cellTimeOff.substr(3, 2));
                    //var inputs =
                    dataView.setUint8(DATAOFFSET.timeOffHrs, hours);
                    dataView.setUint8(DATAOFFSET.timeOffMin, minutes);
                    //dataView.setUint8(DATAOFFSET.pwmBegin, 1);
                    switch (cellInput) {}
                    break;
            }

        }
        if (!(cellPwmOn == "")) {
            var pwm = parseInt(cellPwmOn);
            dataView.setUint8(DATAOFFSET.pwmBegin, pwm & 0xFF);
        }
        if (!(cellPwmOff == "")) {
            var pwm = parseInt(cellPwmOff);
            dataView.setUint8(DATAOFFSET.pwmEnd, pwm & 0xFF);
        }
        if (!(cellInput == "")) {
            switch (cellInput) {
                case 't1':
                    dataView.setUint8(DATAOFFSET.inputNumber, (INPUT.T1) & 0xFF);
                    break;

                case 't2':
                    dataView.setUint8(DATAOFFSET.inputNumber, (INPUT.T2) & 0xFF);
                    break;

                case 'Х':
                    dataView.setUint8(DATAOFFSET.inputNumber, (INPUT.X) & 0xFF);
                    break;
                case 'З':
                    dataView.setUint8(DATAOFFSET.pwmBegin, 1);
                    dataView.setUint8(DATAOFFSET.pwmEnd, 1);
                    break;
                case 'Р':
                    dataView.setUint8(DATAOFFSET.pwmBegin, 1);
                    dataView.setUint8(DATAOFFSET.pwmEnd, 0);
                    break;
                case 'РН':
                    dataView.setUint8(DATAOFFSET.inputNumber, (INPUT.PH) & 0XFF);
                    break;
            }
        }
        if (!(cellTresh == "")) {
            switch (cellFunction) {
                case 'ОТ':
                case 'НТ':
                    var temperature = parseInt(parseFloat(cellTresh) * 16);
                    dataView.setUint16(DATAOFFSET.temperature, temperature & 0xFFFF, true);
                    break;
                case 'СО':
                    var ph = parseInt((parseFloat(cellTresh)) * 10);
                    dataView.setUint16(DATAOFFSET.temperature, ph & 0xFFFF, true);
                    break;
            }

        }
    } // fill ArrayBuffer

    httpPostRequest(bufferTaskTable, 'stts', true);
}

function getTaskTable(dataReceived) {
    var deviceTaskStructByteCount = 15;
    //xmlHttpBinaryRequest('POST',null,messageToReceive,'stts');
    var newTableTxt = [
        []
    ];
    var tableRowsCount = dataReceived.byteLength / deviceTaskStructByteCount;
    //console.log(tableRowsCount);
    for (var i = 0; i < tableRowsCount; i++) {
        newTableTxt[i] = [];
        var dataView = new DataView(dataReceived, i * deviceTaskStructByteCount, deviceTaskStructByteCount);
        newTableTxt[i][TASKTABLE.NUMBER] = i + 1;

        switch (dataView.getUint8(DATAOFFSET.numberLine)) {
            case NUMBERLINE.P1:
                newTableTxt[i][TASKTABLE.OUT] = 'Р1';
                newTableTxt[i][TASKTABLE.PWMON] = '';
                newTableTxt[i][TASKTABLE.PWMOFF] = '';
                break;
            case NUMBERLINE.P2:
                newTableTxt[i][TASKTABLE.OUT] = 'Р2';
                newTableTxt[i][TASKTABLE.PWMON] = '';
                newTableTxt[i][TASKTABLE.PWMOFF] = '';
                break;
            case NUMBERLINE.P3:
                newTableTxt[i][TASKTABLE.OUT] = 'Р3';
                newTableTxt[i][TASKTABLE.PWMON] = '';
                newTableTxt[i][TASKTABLE.PWMOFF] = '';
                break;
            case NUMBERLINE.P4:
                newTableTxt[i][TASKTABLE.OUT] = 'Р4';
                newTableTxt[i][TASKTABLE.PWMON] = '';
                newTableTxt[i][TASKTABLE.PWMOFF] = '';
                break;
            case NUMBERLINE.P5:
                newTableTxt[i][TASKTABLE.OUT] = 'Р5';
                newTableTxt[i][TASKTABLE.PWMON] = '';
                newTableTxt[i][TASKTABLE.PWMOFF] = '';
                break;
            case NUMBERLINE.P6:
                newTableTxt[i][TASKTABLE.OUT] = 'Р6';
                newTableTxt[i][TASKTABLE.PWMON] = '';
                newTableTxt[i][TASKTABLE.PWMOFF] = '';
                break;
            case NUMBERLINE.P7:
                newTableTxt[i][TASKTABLE.OUT] = 'Р7';
                newTableTxt[i][TASKTABLE.PWMON] = '';
                newTableTxt[i][TASKTABLE.PWMOFF] = '';
                break;
            case NUMBERLINE.P8:
                newTableTxt[i][TASKTABLE.OUT] = 'Р8';
                newTableTxt[i][TASKTABLE.PWMON] = '';
                newTableTxt[i][TASKTABLE.PWMOFF] = '';
                break;
            case NUMBERLINE.C1:
                newTableTxt[i][TASKTABLE.OUT] = 'С1';
                newTableTxt[i][TASKTABLE.PWMON] = dataView.getUint8(DATAOFFSET.pwmBegin);
                newTableTxt[i][TASKTABLE.PWMOFF] = dataView.getUint8(DATAOFFSET.pwmEnd);
                break;
            case NUMBERLINE.C2:
                newTableTxt[i][TASKTABLE.OUT] = 'С2';
                newTableTxt[i][TASKTABLE.PWMON] = dataView.getUint8(DATAOFFSET.pwmBegin);
                newTableTxt[i][TASKTABLE.PWMOFF] = dataView.getUint8(DATAOFFSET.pwmEnd);
                break;
            case NUMBERLINE.C3:
                newTableTxt[i][TASKTABLE.OUT] = 'С3';
                newTableTxt[i][TASKTABLE.PWMON] = dataView.getUint8(DATAOFFSET.pwmBegin);
                newTableTxt[i][TASKTABLE.PWMOFF] = dataView.getUint8(DATAOFFSET.pwmEnd);
                break;
            case NUMBERLINE.C4:
                newTableTxt[i][TASKTABLE.OUT] = 'С4';
                newTableTxt[i][TASKTABLE.PWMON] = dataView.getUint8(DATAOFFSET.pwmBegin);
                newTableTxt[i][TASKTABLE.PWMOFF] = dataView.getUint8(DATAOFFSET.pwmEnd);
                break;
            case NUMBERLINE.C5:
                newTableTxt[i][TASKTABLE.OUT] = 'С5';
                newTableTxt[i][TASKTABLE.PWMON] = dataView.getUint8(DATAOFFSET.pwmBegin);
                newTableTxt[i][TASKTABLE.PWMOFF] = dataView.getUint8(DATAOFFSET.pwmEnd);
                break;
            case NUMBERLINE.C6:
                newTableTxt[i][TASKTABLE.OUT] = 'С6';
                newTableTxt[i][TASKTABLE.PWMON] = dataView.getUint8(DATAOFFSET.pwmBegin);
                newTableTxt[i][TASKTABLE.PWMOFF] = dataView.getUint8(DATAOFFSET.pwmEnd);
                break;
            case NUMBERLINE.BP:
                newTableTxt[i][TASKTABLE.OUT] = 'ВР';
                newTableTxt[i][TASKTABLE.PWMON] = '';
                newTableTxt[i][TASKTABLE.PWMOFF] = '';
                break;
        }
        //var FUNCTION = _enum({TC:0,TM:1,TO:2,HT:3,OT:4,TH:5,CO:6,TK:7,UV:8});
        //var DATAOFFSET = _enum({numberLine:0,functionNumber:1,inputNumber:2,timeOnSec:3,timeOnMin:4,timeOnHrs:5,timeOnDow:6,timeOffSec:7,timeOffMin:8,timeOffHrs:9,timeOffDow:10,pwmBegin:11,pwmEnd:12,temperature:13});
        switch (dataView.getUint8(DATAOFFSET.functionNumber)) {
            case FUNCTION.TC:
                newTableTxt[i][TASKTABLE.FUNCTION] = 'ТС';
                newTableTxt[i][TASKTABLE.INPUT] = '';
                newTableTxt[i][TASKTABLE.TRESH] = '';
                newTableTxt[i][TASKTABLE.TIMEON] = digitToTimeView(dataView.getUint8(DATAOFFSET.timeOnHrs)) + ':' + digitToTimeView(dataView.getUint8(DATAOFFSET.timeOnMin));
                var startTime = dataView.getUint8(DATAOFFSET.timeOnHrs) * 3600 + dataView.getUint8(DATAOFFSET.timeOnMin) * 60;
                var stopTime = dataView.getUint8(DATAOFFSET.timeOffHrs) * 3600 + dataView.getUint8(DATAOFFSET.timeOffMin) * 60 + dataView.getUint8(DATAOFFSET.timeOffSec);
                var diffTime = 0;
                if (stopTime >= startTime) {
                    diffTime = stopTime - startTime;
                } else {
                    diffTime = stopTime + ((24 * 3600) - startTime);
                }
                newTableTxt[i][TASKTABLE.TIMEOFF] = digitToTimeView(diffTime);
                break;
            case FUNCTION.TM:
                newTableTxt[i][TASKTABLE.FUNCTION] = 'ТМ';
                newTableTxt[i][TASKTABLE.INPUT] = '';
                newTableTxt[i][TASKTABLE.TRESH] = '';
                newTableTxt[i][TASKTABLE.TIMEON] = digitToTimeView(dataView.getUint8(DATAOFFSET.timeOnHrs)) + ':' + digitToTimeView(dataView.getUint8(DATAOFFSET.timeOnMin));
                var startTime = dataView.getUint8(DATAOFFSET.timeOnHrs) * 3600 + dataView.getUint8(DATAOFFSET.timeOnMin) * 60;
                var stopTime = dataView.getUint8(DATAOFFSET.timeOffHrs) * 3600 + dataView.getUint8(DATAOFFSET.timeOffMin) * 60; //+dataView.getUint8(DATAOFFSET.timeOffSec);
                var diffTime = 0;
                if (stopTime >= startTime) {
                    diffTime = stopTime - startTime;
                } else {
                    diffTime = stopTime + ((24 * 3600) - startTime);
                }
                newTableTxt[i][TASKTABLE.TIMEOFF] = digitToTimeView(diffTime / 60);
                break;
            case FUNCTION.TO:
                newTableTxt[i][TASKTABLE.FUNCTION] = 'ТО';
                newTableTxt[i][TASKTABLE.INPUT] = '';
                newTableTxt[i][TASKTABLE.TRESH] = '';
                newTableTxt[i][TASKTABLE.TIMEON] = digitToTimeView(dataView.getUint8(DATAOFFSET.timeOnHrs)) + ':' + digitToTimeView(dataView.getUint8(DATAOFFSET.timeOnMin));
                newTableTxt[i][TASKTABLE.TIMEOFF] = digitToTimeView(dataView.getUint8(DATAOFFSET.timeOffHrs)) + ':' + digitToTimeView(dataView.getUint8(DATAOFFSET.timeOffMin));
                break;
            case FUNCTION.HT:
                newTableTxt[i][TASKTABLE.FUNCTION] = 'НТ';
                newTableTxt[i][TASKTABLE.PWMON] = '';
                newTableTxt[i][TASKTABLE.PWMOFF] = '';
                newTableTxt[i][TASKTABLE.TIMEON] = '';
                newTableTxt[i][TASKTABLE.TIMEOFF] = '';
                newTableTxt[i][TASKTABLE.INPUT] = '';
                switch (dataView.getUint8(DATAOFFSET.inputNumber)) {
                    case INPUT.T1:
                        newTableTxt[i][TASKTABLE.INPUT] = 't1';
                        break;
                    case INPUT.T2:
                        newTableTxt[i][TASKTABLE.INPUT] = 't2';
                        break;
                    case INPUT.X:
                        newTableTxt[i][TASKTABLE.INPUT] = 'Х';
                        break;
                }
                newTableTxt[i][TASKTABLE.TRESH] = parseFloat(dataView.getUint16(DATAOFFSET.temperature, true)) / 16.0;
                break;
            case FUNCTION.OT:
                newTableTxt[i][TASKTABLE.FUNCTION] = 'ОТ';
                newTableTxt[i][TASKTABLE.PWMON] = '';
                newTableTxt[i][TASKTABLE.PWMOFF] = '';
                newTableTxt[i][TASKTABLE.TIMEON] = '';
                newTableTxt[i][TASKTABLE.TIMEOFF] = '';
                newTableTxt[i][TASKTABLE.INPUT] = '';
                switch (dataView.getUint8(DATAOFFSET.inputNumber)) {
                    case INPUT.T1:
                        newTableTxt[i][TASKTABLE.INPUT] = 't1';
                        break;
                    case INPUT.T2:
                        newTableTxt[i][TASKTABLE.INPUT] = 't2';
                        break;
                    case INPUT.X:
                        newTableTxt[i][TASKTABLE.INPUT] = 'Х';
                        break;
                }
                newTableTxt[i][TASKTABLE.TRESH] = parseFloat(dataView.getUint16(DATAOFFSET.temperature, true)) / 16.0;
                break;
            case FUNCTION.TH:
                newTableTxt[i][TASKTABLE.FUNCTION] = 'ТН';
                newTableTxt[i][TASKTABLE.INPUT] = '';
                newTableTxt[i][TASKTABLE.TRESH] = '';
                newTableTxt[i][TASKTABLE.TIMEON] = dowShrt[dataView.getUint8(DATAOFFSET.timeOnDow)] + " " + digitToTimeView(dataView.getUint8(DATAOFFSET.timeOnHrs)) + ':' + digitToTimeView(dataView.getUint8(DATAOFFSET.timeOnMin));
                var startTime = (dataView.getUint8(DATAOFFSET.timeOnDow) - 1) * 86400 + dataView.getUint8(DATAOFFSET.timeOnHrs) * 3600 + dataView.getUint8(DATAOFFSET.timeOnMin) * 60;
                var stopTime = (dataView.getUint8(DATAOFFSET.timeOnDow) - 1) * 86400 + dataView.getUint8(DATAOFFSET.timeOffHrs) * 3600 + dataView.getUint8(DATAOFFSET.timeOffMin) * 60 + dataView.getUint8(DATAOFFSET.timeOffSec); //+dataView.getUint8(DATAOFFSET.timeOffSec);
                var diffTime = 0;
                if (stopTime >= startTime) {
                    diffTime = stopTime - startTime;
                } else {
                    diffTime = stopTime + ((24 * 3600 * 7) - startTime);
                }
                newTableTxt[i][TASKTABLE.TIMEOFF] = digitToTimeView(diffTime);
                break;
            case FUNCTION.CO:
                newTableTxt[i][TASKTABLE.FUNCTION] = 'СО';
                newTableTxt[i][TASKTABLE.PWMON] = '';
                newTableTxt[i][TASKTABLE.PWMOFF] = '';
                newTableTxt[i][TASKTABLE.TIMEON] = '';
                newTableTxt[i][TASKTABLE.TIMEOFF] = '';
                newTableTxt[i][TASKTABLE.INPUT] = '';
                newTableTxt[i][TASKTABLE.TRESH] = parseFloat(dataView.getUint16(DATAOFFSET.temperature, true)) / 10.0;
                //console.log(dataView.getUint8(DATAOFFSET.temperature));
                break;
            case FUNCTION.TK:
                newTableTxt[i][TASKTABLE.FUNCTION] = 'ЦВ';
                newTableTxt[i][TASKTABLE.INPUT] = '';
                newTableTxt[i][TASKTABLE.TRESH] = '';
                newTableTxt[i][TASKTABLE.TIMEON] = digitToTimeView(dataView.getUint8(DATAOFFSET.timeOnMin) * 60 + dataView.getUint8(DATAOFFSET.timeOnSec));
                newTableTxt[i][TASKTABLE.TIMEOFF] = digitToTimeView(dataView.getUint8(DATAOFFSET.timeOffMin) * 60 + dataView.getUint8(DATAOFFSET.timeOffSec));

                break;
            case FUNCTION.UV:
                newTableTxt[i][TASKTABLE.FUNCTION] = 'УВ';
                newTableTxt[i][TASKTABLE.PWMOFF] = '';
                newTableTxt[i][TASKTABLE.PWMON] = '';
                newTableTxt[i][TASKTABLE.TIMEON] = '';
                newTableTxt[i][TASKTABLE.TIMEOFF] = digitToTimeView(dataView.getUint8(DATAOFFSET.timeOffHrs)) + ':' + digitToTimeView(dataView.getUint8(DATAOFFSET.timeOffMin));
                newTableTxt[i][TASKTABLE.INPUT] = '';
                newTableTxt[i][TASKTABLE.TRESH] = '';
                switch (dataView.getUint8(DATAOFFSET.pwmEnd)) {
                    case 1:
                        newTableTxt[i][TASKTABLE.INPUT] = 'З';
                        break;
                    case 0:
                        newTableTxt[i][TASKTABLE.INPUT] = 'Р';
                        break;
                }
                break;
        }

    }

    document.getElementById('mainTaskTable').removeChild(document.getElementById('taskTable'));
    document.getElementById('mainTaskTable').appendChild(populateTable(null, newTableTxt.length, taskTableHdr.length, newTableTxt));
}

function taskTableBtnInit() {
    var tableEdit = document.getElementById('taskEditTable');
    var cellCount = tableEdit.rows[0].cells.length
    //tableEdit.rows[1].cells[0].innerHTML=1;
    for (var i = 0; i < cellCount; i++) {
        tableEdit.rows[1].cells[i].childNodes[1].value = taskTableTxt[0][i];
    }
}

function xmlHttpGetBinaryRequest(messageName, callback) {
    var xmlHttpRequest = new XMLHttpRequest();
    var adr = adress + "/" + messageName + "/";

    modal.show(LOADING);

    xmlHttpRequest.open('GET', adr, true);
    xmlHttpRequest.responseType = 'arraybuffer';
    xmlHttpRequest.onload = function() {
        var message = xmlHttpRequest.response;
        callback(message);
        modal.hide();
    };
    xmlHttpRequest.send();
}

function digitToTimeView(digit) {
    var timeView;
    if (digit < 0 || digit > 99) {
        return timeView;
    }
    if (digit < 10) {
        timeView = "0" + digit;
    } else {
        timeView = digit;
    }

    return timeView;
}

function changeColor(selectItem) {
    switch (selectItem.value) {
        case "0":
            selectItem.style.color = "red";
            break;
        case "1":
            selectItem.style.color = "green";
            break;
        case "2":
            selectItem.style.color = "blue";
            break;
    }

}

function editOnOff(item) {
    //item.value="";
    var string = "";
    var cldrTable = document.getElementById("calendar_tt");
    var dow = cldrTable.rows[1].cells[0].childNodes[1].childNodes[0].value;
    var hours = cldrTable.rows[1].cells[1].childNodes[1].childNodes[0].value;
    var minutes = cldrTable.rows[1].cells[2].childNodes[1].childNodes[0].value;

    var patt_minutes_seconds = /(^[0-9][0-9]$)/;
    var patt_hours = /(^([0-1][0-9]|2[0-3]):[0-5][0-9]$)/;
    var patt_dow = /^(ПН |ВТ |СР |ЧТ |ПТ |СБ |ВС )?([0-1][0-9]|2[0-3]):[0-5][0-9]$/;

    if (dow != "") {
        string = dow + " ";
    }
    if (hours != "") {
        string = string + digitToTimeView(hours) + ":";
    }
    if (minutes != "") {
        string = string + digitToTimeView(minutes);
    }

    if (patt_minutes_seconds.test(string)) {
        item.value = string;
    } else if (patt_hours.test(string)) {
        item.value = string;
    } else if (patt_dow.test(string)) {
        item.value = string;
    } else if (string == "") {
        item.value = "";
    } else {
        alert("Ошибка ввода.");
    }

    cldrTable.rows[1].cells[0].childNodes[1].value = "";
    cldrTable.rows[1].cells[1].childNodes[1].value = "";
    cldrTable.rows[1].cells[2].childNodes[1].value = "";

}

function populateSelect(cData) {
    var select = document.createElement('select');
    select.className = "inEditTbl";

    var option = document.createElement('option');
    option.value = option.textContent = "";
    option.selected = "true";
    select.appendChild(option);

    for (var i = 0; i <= cData; i++) {
        option = document.createElement('option');
        option.value = option.textContent = i;
        select.appendChild(option);
    }

    return select;
}

function readLedNames() {
  for (var i = 1; i <= 6; i++) {
    var key = "led" + i + "Name";
    var name = localStorage.getItem(key);
    if (name) {
      $("." + key).text(name);
      $("#" + key).val(name);
    }
  }
}

function updateLedNames() {
  for (var i = 1; i <= 6; i++) {
    var key = "led" + i + "Name";
    var name = $("#"+ key).val();
    if (name) {
      localStorage.setItem(key, name);
      $("." + key).text(name);
    }
  }
}

$(document).ready(function() {
    document.getElementById("mainTaskTable").appendChild(populateTable(null, taskTableTxt.length, taskTableHdr.length, taskTableTxt));
    taskTableBtnInit();
    readLedNames();
    $.material.init();

    urlString = localStorage.urlLastName;
    if (urlString !== undefined) {
        $('#inURL').val(urlString);
        adress = urlString + portString;
    }

    $('[data-toggle="tooltip"]').tooltip();

    $("#btnGetTasks").click(function() {
        xmlHttpGetBinaryRequest('gtts', getTaskTable);
    });

    $("#btnPostTasks").click(function() {
        setTaskTable();
    });

    $("#btnAddRow").click(function() {
        addRow('taskTable',rowIndexTaskTable,taskTableTxt);
    });

    $("#btnDeleteRow").click(function() {
        delRow('taskTable', rowIndexTaskTable);
    });

    $("#btnEditRow").click(function() {
        editRow('taskTable', taskTableHdr.length, taskTableTxt);
    });

    $("#btnSaveSettings").click(function() {
        localStorage.urlLastName = $('#inURL').val();
        urlString = localStorage.urlLastName;
        adress = urlString + portString;

        updateLedNames();
    });

    $("#btnGetKnobsValues").click(function() {
        httpGetRequest('gtkb', getKnobsTable);
    });

    $("#btnPostKnobsValues").click(function() {
        setKnobsTable();
    });

    $("#btnGetFanValues").click(function() {
        httpGetRequest('gtfn', getFanTable);
    });

    $("#btnPostFanValues").click(function() {
        setFanTable();
    });

    $("#btnPostDate").click(function() {
        setDate();
    });

    $("#btnStartPhCalibration").click(function() {
        calibrPhReq('cphb');
    });

    $("#btnReadyPh4").click(function() {
        calibrPhReq('cph4');
    });

    $("#btnReadyPh7").click(function() {
        calibrPhReq('cph7');
    });

    $("#btnStopPhCalibration").click(function() {
        calibrPhReq('cphe');
    });

    $("#bntGetMoonValues").click(function() {
        httpGetRequest('gtml', getMoonLightTable);
    });

    $("#bntPostMoonValues").click(function() {
        setMoonLightTable();
    });

    $("#btnStartSearchTSensor").click(function() {
        searchTSReq('tsrc');
    });

    $("#btnStopSearchTSensor").click(function() {
        searchTSReq('tstp');
    });

    $("#btnStartLedTest").click(function() {
        testLedsReq('gttb');
    });

    $("#btnEndLedTest").click(function() {
        testLedsReq('gtte');
    });

    $("#btnDispl").click(function() {
        httpGetRequest('gtdl', getDisplay);
    })

    $("#GetDisplCheck").click(function() {
        getDisplTimer();
    });

    $("select.form-control").change(function() {
        changeColor(this);
    })
});
