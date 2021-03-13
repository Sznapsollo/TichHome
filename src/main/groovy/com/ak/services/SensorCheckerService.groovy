package com.ak.services

import io.vertx.core.logging.Logger
import io.vertx.core.json.JsonObject

class SensorCheckerService {
    Logger logger = io.vertx.core.logging.LoggerFactory.getLogger('MyMainGroovyVerticle')

    private def sensors
    private def filePath

    SensorCheckerService() {}
    SensorCheckerService(def settingsService) {
        this.filePath = settingsService.sensorsFilePath
        this.loadSensorNodes()
    }

    def loadSensorNodes() {
        def jsonObj
        File sensorsFile = new File(this.filePath)
        if (sensorsFile.exists()) {
            String fileContent = sensorsFile.text
            jsonObj = (new JsonObject(fileContent)).mapTo(Map.class);
        } else {
            localLogger "config file for sensors ${filePath} does not exist !!!"
        }

        this.sensors = jsonObj?.sensors ?: [];
    }

	def getSensors() {
		return this.sensors;
	}

	def checkSensor(def id) {
        def foundItem = this.sensors?.find { item -> item.id == id }
        return foundItem ?: null
	}

	void localLogger(def message, def onlyDev = false) {
		logger.info((((message).toString()) << '\n').toString())
	}
}