package com.ak.services

import io.vertx.core.logging.Logger
import io.vertx.core.json.JsonObject

class SettingsService {
    Logger logger = io.vertx.core.logging.LoggerFactory.getLogger('MyMainGroovyVerticle')

    public def eventBusMessagesDelay
	public def httpServerAddress
	public def httpServerPort
	public def eventBusPath
	public def akHomeAutomationServerPath
	public def eventBusIdleLifespan
	public def wwwPath
	public def backupsPath
	public def hmErrorDebounceTimer
	public def useTestData
	public def translations
	public def canChangeAlarmSettings
	public def logsDropdownFilter
	public def nodesFilePath
	public def sensorsFilePath
	public def sensorSettingsFilesPath
	public def logsFolderPath
	public def delayFilesPath
	public def regularactionFilesPath
	public def processesFilesPath
	public def codeSendPath
	public def conradCodeSendPath
	public def saveDailyLogsToFile
	public def webServerAddress
	public def satelliteServerAddresses

    SettingsService() {}
    SettingsService(def config) {

        localLogger "Starting akHomeAutomationServerPath with settings"

		eventBusMessagesDelay = config.getInteger("eventbus.messages.delay", 4000)
		localLogger "eventBusMessagesDelay: ${eventBusMessagesDelay}"

		eventBusIdleLifespan = config.getInteger("eventbus.subscription.idle.lifespan", 300000)
		localLogger "eventBusIdleLifespan: ${eventBusIdleLifespan}"

		httpServerAddress = config.getString("http.server.address", "0.0.0.0")
		localLogger "httpServerAddress: ${httpServerAddress}"

		httpServerPort = config.getInteger("http.server.port", 8081)
		localLogger "httpServerPort: ${httpServerPort}"

		eventBusPath = config.getString("http.server.eventbus.path", "eventbus")
		localLogger "eventBusPath: ${eventBusPath}"

		akHomeAutomationServerPath = config.getString("http.server.akHomeAutomationServer.path", "akHomeAutomation")
		localLogger "akHomeAutomationServerPath: ${akHomeAutomationServerPath}"

		wwwPath = config.getString("www.path", null)
		localLogger "wwwPath: ${wwwPath}"

		backupsPath = config.getString("backups.path", '')
		localLogger "backupsPath: ${backupsPath}"

		useTestData = config.getBoolean("useTestData", false)
		localLogger "useTestData: ${useTestData}"

		translations = config.getJsonArray('translations')
		localLogger "translations: ${translations}"

		logsDropdownFilter = config.getJsonArray("logsDropdownFilter")
		localLogger "logsDropdownFilter: ${logsDropdownFilter}"

		canChangeAlarmSettings = config.getBoolean("canChangeAlarmSettings", canChangeAlarmSettings)
		localLogger "canChangeAlarmSettings: ${canChangeAlarmSettings}"

		nodesFilePath = config.getString("nodes.file.path", '')
		localLogger "nodes.file.path: ${nodesFilePath}"

		sensorsFilePath = config.getString("sensors.file.path", '')
		localLogger "sensors.file.path: ${sensorsFilePath}"

		sensorSettingsFilesPath = config.getString("sensor.settings.files.path", '')
		localLogger "sensor.settings.files.path: ${sensorSettingsFilesPath}"

		logsFolderPath = config.getString("logs.folder.path", '')
		localLogger "logs.folder.path: ${logsFolderPath}"

		regularactionFilesPath = config.getString("regularaction.files.path", '')
		localLogger "regularaction.files.path: ${regularactionFilesPath}"

		delayFilesPath = config.getString("delay.files.path", '')
		localLogger "delay.files.path: ${delayFilesPath}"

		processesFilesPath = config.getString("processes.files.path", '')
		localLogger "processes.files.path: ${processesFilesPath}"

		codeSendPath = config.getString("code.send.path", '')
		localLogger "code.send.path: ${codeSendPath}"

		conradCodeSendPath = config.getString("conrad.code.send.path", '')
		localLogger "conrad.code.send.path: ${conradCodeSendPath}"

		saveDailyLogsToFile = config.getBoolean("save.daily.logs.to.file", true)
		localLogger "save.daily.logs.to.file: ${saveDailyLogsToFile}"

		webServerAddress = config.getString("web.server.address", '')
		localLogger "web.server.address: ${webServerAddress}"

		satelliteServerAddresses = config.getJsonArray("satellite.server.addresses")
		satelliteServerAddresses = satelliteServerAddresses
		localLogger "satellite.server.addresses: ${satelliteServerAddresses}"
    }

	void localLogger(def message, def onlyDev = false) {
		logger.info((((message).toString()) << '\n').toString())
	}


}