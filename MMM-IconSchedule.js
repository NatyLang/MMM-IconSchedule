Module.register('MMM-IconSchedule', {

    // Default values
    defaults: {
      weeksToDisplay: 20,
      limitTo: 5,
      dateFormat: "dddd D MMMM",
      fade: true,
      fadePoint: 0.25,     // Start on 1/4th of the list.
      icons: []
    },

    // Define stylesheet
    getStyles: function () {
      return ["MMM-IconSchedule.css"];
    },

    // Define required scripts.
    getScripts: function () {
      return ["moment.js"];
    },


    capFirst: function (string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    },

    start: function () {
      console.log('Starting module: ' + this.name);
      this.sendSocketNotification('MMM-ICONSCHEDULE-CONFIG', this.config);
      this.nextDates = [];
      this.getDates();
      this.timer = null;
    },

    // Read garbage_schedule.csv file
    getDates: function () {
      clearTimeout(this.timer);
      this.timer = null;
      this.sendSocketNotification("MMM-ICONSCHEDULE-GET", { weeksToDisplay: this.config.weeksToDisplay, instanceId: this.identifier });

      //Set check times
      var self = this;
      this.timer = setTimeout(function () {
        self.getDates();
      }, 24 * 7 * 60 * 60 * 1000); //update once a day
    },

    socketNotificationReceived: function (notification, payload) {
      if (notification == "MMM-ICONSCHEDULE-RESPONSE" + this.identifier && payload.length > 0) {
        this.nextDates = payload;
        this.updateDom(1000);
      }
    },

	faIconFactory: function (icon) {
		const span = document.createElement('span');
		span.className = "schedule-icon";

		  var obj = this.config.icons.find(o => o.name == icon)

		  if(obj){
			  span.style.cssText = "color: " + obj.color;
			  span.innerHTML = '<i class="' + obj.icon + '" aria-hidden="true"></i>';
		  }
		  else {
			  span.style.cssText = "color: #ffffff";
			  span.innerHTML='<i class="fa fa-calendar" aria-hidden="true"></i>';
		  }

		return (span);
	  },

    getDom: function () {
      var wrapper = document.createElement("div");

      if (this.nextDates.length == 0) {
        wrapper.innerHTML = "No upcoming events";
        wrapper.className = "dimmed light small";
        return wrapper;
      }

      // Start Fade effect
      if (this.config.fade && this.config.fadePoint < 1) {
        if (this.config.fadePoint < 0) {
          this.config.fadePoint = 0;
        }
        var startFade = Math.min(this.nextDates.length, this.config.limitTo) * this.config.fadePoint;
        var fadeSteps = Math.min(this.nextDates.length, this.config.limitTo) - startFade;
      }
      var currentFadeStep = 0;
      // End Fade effect

      // this.nextDates.forEach( function(pickup) {
      for (i = 0; i < this.nextDates.length; i++) {
        if (i == this.config.limitTo) {
          break;
        }

        var dates = this.nextDates[i];

        //Create CSS Elements
        var eventContainer = document.createElement("div");
        eventContainer.classList.add("icon-container");

        //Add date to Garbage Pickup
        var dateContainer = document.createElement("span");
        dateContainer.classList.add("icon-date");

        //Formats Garbage Pickup Date
        moment.locale();
        var today = moment().startOf("day");
        var iconDate = moment(dates.date);
        if (today.isSame(iconDate)) {
          dateContainer.innerHTML = "Today";
        } else if (moment(today).add(1, "days").isSame(iconDate)) {
          dateContainer.innerHTML = "Tomorrow";
        } else if (moment(today).add(7, "days").isAfter(iconDate)) {
          dateContainer.innerHTML = this.capFirst(iconDate.format("dddd"));
        } else {
          dateContainer.innerHTML = this.capFirst(iconDate.format(this.config.dateFormat));
        }

        eventContainer.appendChild(dateContainer);

        //Add Garbage icons
        var iconContainer = document.createElement("span");
        iconContainer.classList.add("icon-icon-container");
        for (var key in dates) {
          //Convert date strings to moment.js Date objects
          if (key != "date" && key != "Date")
            if (dates[key])
				//iconContainer.appendChild(this.svgIconFactory(key));
				iconContainer.appendChild(this.faIconFactory(key));

        }

        eventContainer.appendChild(iconContainer);
        wrapper.appendChild(eventContainer);

        // Start Fading
        if (i >= startFade) {	//fading
          currentFadeStep = i - startFade;
          eventContainer.style.opacity = 1 - (1 / fadeSteps * currentFadeStep);
        }
        // End Fading

      };

      return wrapper;
    }

  });
