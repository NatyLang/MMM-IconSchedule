var fs = require("fs");
var NodeHelper = require("node_helper");
var parse = require("csv-parse");
var moment = require("moment");


module.exports = NodeHelper.create({

	start: function () {
		console.log("Starting node_helper for module: " + this.name);
		this.schedule = null;
		this.scheduleCSVFile = this.path + "/schedule.csv";
	},

	socketNotificationReceived: function(notification, payload) {

		var self = this;
		var scheduleFile = this.scheduleCSVFile;
		fs.readFile(scheduleFile, "utf8", function(err, rawData) {
			if (err) throw err;
			parse(rawData, {delimiter: ",", columns: true, ltrim: false}, function(err, parsedData) {
				if (err) throw err;

				self.schedule = parsedData;
				self.postProcessSchedule();
				self.getNextPickups(payload);
			});
		});

	},

	postProcessSchedule: function() {

		this.schedule.forEach(function (obj) {
			for (var key in obj) {
				if (key === "Date") {
					obj.date = moment(obj.Date, "DD/MM/YY");
				}
				else
					obj[key] = obj[key] !== "0"
			}
		});

	},

	getNextPickups: function(payload) {
		var start = moment().startOf("day"); //today, 12:00 AM
		var end = moment().startOf("day").add(payload.weeksToDisplay * 7, "days");

		//find info for next days
		var nextDays = this.schedule.filter(function (obj) {
			return obj.date.isSameOrAfter(start) &&
			obj.date.isBefore(end);
		});
		nextDays = nextDays.sort(function(a,b){
			return new Date(a.date) - new Date(b.date);
		  });

		this.sendSocketNotification('MMM-ICONSCHEDULE-RESPONSE' + payload.instanceId, nextDays);

	}

});
