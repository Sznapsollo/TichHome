package com.ak.services

import io.vertx.core.logging.Logger

import com.ak.services.ItemCheckerService
import com.ak.services.HelperService

import static com.ak.services.HelperService.toString

class RegularActionsService {
    Logger logger = io.vertx.core.logging.LoggerFactory.getLogger('MyMainGroovyVerticle')

	HelperService helperService
	private def vertxReference
	ItemCheckerService itemCheckerService

	// def sudo = "sudo "
	def sudo = ""
	private Map actions = [:]
	def doRegularActions = true

	RegularActionsService() {}
    RegularActionsService(def vertx, def settingsServiceRef, def itemCheckerServiceRef, def actionsRef) {
		vertxReference = vertx
		helperService = new HelperService()
		itemCheckerService = itemCheckerServiceRef
		actions = actionsRef as Map

		vertx.setPeriodic(10000, { timerId ->
			if(doRegularActions == false) {
				return
			}
			runRegularActions()
		})
    }

	void runRegularActions() {
		def todayDate = new Date()
		Calendar calendar = GregorianCalendar.getInstance(TimeZone.getTimeZone("GMT"))
		calendar.setTime(todayDate)
		def year = calendar.get(Calendar.YEAR)
		def calendarMonth = calendar.get(Calendar.MONTH)
		def month = calendarMonth + 1
		def dayOfMonth = calendar.get(Calendar.DAY_OF_MONTH)
		def dayOfWeek = translateDayOfWeek(calendar.get(Calendar.DAY_OF_WEEK))

		def performUpdateOnItems = [:]
		def items = itemCheckerService.getItems(null);
		items?.each { item ->
			def randomActiveToday = false
			if(!item.regularActionsData) {
				return
			}
			def regularActionsDataMap = item.regularActionsData.mapTo(Map.class);

			def actionToPerform = "NONE"
			regularActionsDataMap.timeUnits?.find { timeUnit ->
				def timeStart = timeUnit['timeStart']
				def timeEnd = timeUnit['timeEnd']

				def hourStart
				def minuteStart
				def secondStart
				def hourEnd
				def minuteEnd
				def secondEnd

				def adjustTimeData = {
					hourStart = timeStart ? timeStart.split(':')[0] : '0'
					minuteStart = timeStart ? timeStart.split(':')[1] : '0'
					secondStart = '0'
					hourEnd = timeEnd ? timeEnd.split(':')[0] : '23'
					minuteEnd = timeEnd ? timeEnd.split(':')[1] : '59'
					secondEnd = timeEnd ? '0' : '59'
				}

				adjustTimeData()

				def days = timeUnit['daysOfWeek'].split(',').findAll{it != ''}.collect {it.toInteger()}
				if(timeUnit.random) {
					if(days.contains(dayOfWeek) && item.regularActionDayOffPerformed != dayOfWeek) {
						if(!item.regularActionRandomStart || !item.regularActionRandomEnd) {

							def number1 = getRandomNumberInRange(hourStart.toInteger(), hourEnd.toInteger())
							def number2 = getRandomNumberInRange(hourStart.toInteger(), hourEnd.toInteger())

							def randHourStart = number1 >= number2 ? number2 : number1
							def randHourEnd = number1 >= number2 ? number1 : number2

							def startMinMinuteForRand = randHourStart == hourStart.toInteger() ? minuteStart.toInteger() : 0
							def startMaxMinuteForRand = randHourStart == hourEnd.toInteger() ? minuteEnd.toInteger() : 59

							def endMinMinuteForRand = hourStart.toInteger() == randHourEnd ? minuteStart.toInteger() : 0
							def endMaxMinuteForRand = randHourEnd == hourEnd.toInteger() ? minuteEnd.toInteger() : 59

							def randMinuteStart = getRandomNumberInRange(startMinMinuteForRand, startMaxMinuteForRand)
							def randMinuteEnd = getRandomNumberInRange(endMinMinuteForRand, endMaxMinuteForRand)

							if(randHourStart == randHourEnd) {
								while(randMinuteEnd <= randMinuteStart) {
									if(randMinuteStart == 0) {
										if (randMinuteEnd == 0) {
											randMinuteEnd += 5
										}
										break
									}
									randMinuteStart -= 1
								}
							}

							def padNumber = {testNumber ->
								return (testNumber < 10 ? "0" : "") + testNumber;
							}

							timeStart = toString("${padNumber(randHourStart)}:${padNumber(randMinuteStart)}")
							timeEnd = toString("${padNumber(randHourEnd)}:${padNumber(randMinuteEnd)}")
							
							item.regularActionRandomStart = timeStart
							item.regularActionRandomEnd = timeEnd
							
							// was setup so requires update
							performUpdateOnItems[(item.getProp('name'))] = item

							localLogger "------ obtained random start: ${timeStart} end: ${timeEnd} for ${item.getProp('name')}"
						} else {
							timeStart = item.regularActionRandomStart
							timeEnd = item.regularActionRandomEnd
							
							// localLogger "------ obtained random start: ${timeStart} end: ${timeEnd} for ${item.getProp('name')}"
						}
						randomActiveToday = true

						adjustTimeData()
					}
				}

				def todayDateTimeStart = new Date().copyWith(
					year: year, 
					month: calendarMonth, 
					dayOfMonth: dayOfMonth, 
					hourOfDay: hourStart.toInteger(),
					minute: minuteStart.toInteger(),
					second: secondStart.toInteger()
				)

				def todayDateTimeEnd = new Date().copyWith(
					year: year, 
					month: calendarMonth, 
					dayOfMonth: dayOfMonth, 
					hourOfDay: hourEnd.toInteger(),
					minute: minuteEnd.toInteger(),
					second: secondEnd.toInteger()
				)

				if(days.contains(dayOfWeek)) {
					if(!timeStart) {
						if(todayDateTimeEnd < todayDate && item.regularActionDayOffPerformed != dayOfWeek) {
							actionToPerform = "OFF"
						}
					}
					else if(todayDateTimeStart <= todayDate && todayDate <= todayDateTimeEnd) {
						actionToPerform = "ON"
						return true
					}
				}
			}

			// if(item.regularActionRandomStart && item.regularActionRandomEnd){
			// 	localLogger "${item.getProp('name')} - ${item.regularActionRandomStart} - ${item.regularActionRandomEnd}"
			// }

			if(actionToPerform == "ON" && item.regularActionStatus != "ON") {
				localLogger "Scheduled(1) enabling ${item.getProp('name')}"
				actions.toggleAction([outletId: item.getProp('name'), outletStatus: 'on', outletDelayed: -1, outletSource: 'Scheduled'])
				enable(item)
			} else if(actionToPerform == "NONE" && item.regularActionStatus == "ON") {
				localLogger "Scheduled(2) disabling ${item.getProp('name')}"
				actions.toggleAction([outletId: item.getProp('name'), outletStatus: 'off', outletDelayed: -1, outletSource: 'Scheduled'])
				disable(item)
			} else if(actionToPerform == "OFF") {
				localLogger "Scheduled(3) disabling ${item.getProp('name')}"
				actions.toggleAction([outletId: item.getProp('name'), outletStatus: 'off', outletDelayed: -1, outletSource: 'Scheduled'])
				disable(item)
				item.regularActionDayOffPerformed = dayOfWeek
			}

			if(!randomActiveToday) {
				if(item.regularActionRandomStart || item.regularActionRandomEnd) {
					// has some got to null it
					item.regularActionRandomStart = null
					item.regularActionRandomEnd = null
					performUpdateOnItems[(item.getProp('name'))] = item
				}	
			}
		}

		performUpdateOnItems?.each { itemKey, itemValue ->
			// should push to inform
			actions.pushEventBusMessage([path: "applicationMessage/", message: [name: (("updateRegularActionDataRandoms-${itemKey}").toString()), type: 'callbackCenter', centerName: 'updateRegularActionDataRandoms', status: 'OK', data: 
			[
				name: itemKey,
				regularActionRandomStart: itemValue.regularActionRandomStart,
				regularActionRandomEnd: itemValue.regularActionRandomEnd
			]]])
		}
	}

	def translateDayOfWeek(def day) {
		switch(day) {
			case 1:
				return 6
			case 2: 
				return 0
			case 3:
				return 1
			case 4: 
				return 2
			case 5:
				return 3
			case 6:
				return 4
			case 7:
				return 5
		}
	}

	void disable(def item) {
		item.regularActionStatus = 'OFF'
		item.regularActionRandomStart = null
		item.regularActionRandomEnd = null
	}

	void enable(def item) {
		item.regularActionStatus = 'ON'
	}

	def randomGenerator
	private int getRandomNumberInRange(int min, int max) {

        if (min >= max) {
			localLogger "range is same number !!!! ${min} vs ${max}"
            return min
        }

		if(!randomGenerator) {
			randomGenerator = new Random();
		}
        
        return randomGenerator.nextInt((max - min) + 1) + min;
    }

	void localLogger(def message, def onlyDev = false) {
		logger.info(toString((message).toString() << '\n'))
	}
}