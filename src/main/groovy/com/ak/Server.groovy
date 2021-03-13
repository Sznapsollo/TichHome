package com.ak

import java.util.Map

import com.fasterxml.jackson.databind.ser.AnyGetterWriter
import com.google.common.cache.CacheBuilder
import com.google.common.cache.CacheLoader
import com.google.common.cache.LoadingCache
import io.vertx.core.AbstractVerticle
import io.vertx.core.AsyncResult
import io.vertx.core.Handler
import io.vertx.core.buffer.Buffer
import io.vertx.core.http.HttpServerRequest
import io.vertx.core.http.HttpClient
import io.vertx.core.http.HttpClientOptions
import io.vertx.core.http.HttpServerOptions
import io.vertx.core.json.DecodeException
import io.vertx.core.json.JsonObject
import io.vertx.core.json.JsonArray
import io.vertx.core.logging.Logger
import io.vertx.core.net.JksOptions
import io.vertx.core.datagram.DatagramPacket
import io.vertx.ext.bridge.PermittedOptions
import io.vertx.ext.web.handler.sockjs.BridgeOptions
import io.vertx.ext.web.handler.sockjs.SockJSHandler
import io.vertx.ext.web.Router
import io.vertx.ext.web.handler.StaticHandler
import io.vertx.ext.web.handler.TimeoutHandler
import io.vertx.ext.web.handler.BodyHandler
import java.util.concurrent.TimeUnit
import java.text.SimpleDateFormat
import groovy.io.FileType
import java.lang.Math;

import com.ak.services.SettingsService
import com.ak.services.HelperService
import com.ak.services.ItemCheckerService
import com.ak.services.SensorCheckerService
import com.ak.services.SignalSenderService
import com.ak.services.RegularActionsService

class Server extends AbstractVerticle {
	Logger logger = io.vertx.core.logging.LoggerFactory.getLogger('MyMainGroovyVerticle')
	SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSZ")
	SimpleDateFormat dateFormat2 = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss")
	
	SettingsService settingsService
	HelperService helperService
	ItemCheckerService itemCheckerService
	SensorCheckerService sensorCheckerService
	SignalSenderService signalSenderService
	RegularActionsService regularActionsService

	def router
	private Map scheduledUpdates = [:]

	private def registeredHandles = [:]
	private def final warningsMinutelyCacheHours = 24

	private LoadingCache<String, Map> shortKeyCache = CacheBuilder.newBuilder()
		.expireAfterWrite(1, TimeUnit.MINUTES)
		.build(
			new CacheLoader<String, Map>() {
				public Map load(String key) throws Exception {
					localLogger('Creating event minute key ' << key)
					return [name: key]
				}
			}
		);

	private LoadingCache<String, Map> warningsMinutely = CacheBuilder.newBuilder()
		//.maximumSize(60)
		.expireAfterWrite(warningsMinutelyCacheHours, TimeUnit.HOURS)
		.build(
			new CacheLoader<String, Map>() {
				public Map load(String key) throws Exception {
					localLogger('Creating warning minute key ' << key)
					def cacheWarningsObj = [name: key, entries: []]
					return cacheWarningsObj;
				}
			}
		);

	private LoadingCache<String, Map> cacheByKeyContainer = CacheBuilder.newBuilder()
		//.maximumSize(60)
		.expireAfterWrite(15, TimeUnit.DAYS)
		.build(
			new CacheLoader<String, Map>() {
				public Map load(String key) throws Exception {
					localLogger('Creating warning key ' << key)
					def cacheByKeyObj = [name: key, data: [:]]
					return cacheByKeyObj;
				}
			}
		);

	@Override
	public void start() throws Exception {
		
		settingsService = new SettingsService(config())
		helperService = new HelperService()

		HttpServerOptions httpServerOptions
		httpServerOptions = new HttpServerOptions()

		itemCheckerService = new ItemCheckerService(settingsService)
		sensorCheckerService = new SensorCheckerService(settingsService)
		signalSenderService = new SignalSenderService(vertx, settingsService, itemCheckerService, [stopRegularActionsService: this.&stopRegularActionsService, startRegularActionsService: this.&startRegularActionsService])
		regularActionsService = new RegularActionsService(vertx, settingsService, itemCheckerService, [toggleAction: this.&toggleAction])

		router = Router.router(vertx)
		
		prepareFileWebserver()
		prepareSearchKeyWarningsRoute()
		prepareActionsRoute()
		prepareWebsocketServer()

		vertx.createHttpServer(httpServerOptions).requestHandler(router).listen(settingsService.httpServerPort, settingsService.httpServerAddress)

		vertx.setPeriodic(10000, { timerId ->
			def cleanSessions = [] 
			registeredHandles.each { sessionIdKey, sessionIdValue ->
				def currentDate = new Date()
				if((currentDate.getTime() - sessionIdValue.activityDate.getTime()) > settingsService.eventBusIdleLifespan) {
					cleanSessions << sessionIdKey
				}
			}
			cleanSessions.each { sessionIdKey ->
				localLogger "removing idle session ${sessionIdKey}"
				registeredHandles.remove(sessionIdKey)
				localLogger "remaining sessions ${registeredHandles}"
			}
		})
	}

	private void prepareFileWebserver() {
		localLogger 'prepareFileWebserver'

		// vertx.createHttpServer()
		// .requestHandler({HttpServerRequest req ->
		// 	req.response().end('<h1>Hello from vert.x</h1>')
		// })
		// .listen(8081)

		def staticPageHandler = StaticHandler.create()
		staticPageHandler.setCachingEnabled(false)
		// staticPageHandler.setDirectoryListing(true)
		if(settingsService.wwwPath) {
			staticPageHandler.setAllowRootFileSystemAccess(true)
			staticPageHandler.setWebRoot(settingsService.wwwPath)
		}
		router.route("/${settingsService.akHomeAutomationServerPath}/*").handler(staticPageHandler)
	}

	private void prepareSearchKeyWarningsRoute() {
		// curl -i -k -X POST  --header  "Content-Type: application/json"  --data '{"searchCriteria":{"text":"SZUKANA FRAZA"}}' http://0.0.0.0:8081/akHomeAutomation/searchKeyWarnings
		def searchKeyWarningsPath = "/${settingsService.akHomeAutomationServerPath}/searchKeyWarnings"
		router.route(searchKeyWarningsPath).handler(BodyHandler.create());
		router.route(searchKeyWarningsPath).handler({ routingContext ->
			def incomingData = routingContext.getBodyAsJson()
			
			def searchResults = performKeyCacheSearch(incomingData)

			def resultObj = new JsonObject(searchResults)
			routingContext.response().putHeader("content-type", "application/json; charset=utf-8").end(resultObj.toString())
			// routingContext.response().putHeader("content-type", "text/html").end("Hello World!")
		})
	}

	private void stopRegularActionsService() {
		localLogger 'stopRegularActionsService'
		regularActionsService.doRegularActions = false
	}

	private void startRegularActionsService() {
		localLogger 'startRegularActionsService'
		regularActionsService.doRegularActions = true
	}

	private void prepareActionsRoute() {
		// curl -i -k -X POST  --header  "Content-Type: application/json"  --data '{"type":"backup"}' http://0.0.0.0:8081/akHomeAutomation/actions
		def actionsPath = "/${settingsService.akHomeAutomationServerPath}/actions"
		// router.route(actionsPath).handler(TimeoutHandler.create(3000)); // 3 seconds
		router.route(actionsPath).handler(BodyHandler.create());
		router.route(actionsPath).handler({ routingContext ->
			def result = [status: 'OK', message: null]

			def incomingData = routingContext.getBodyAsJson()
			if(incomingData instanceof JsonObject) {
				incomingData = incomingData.mapTo(Map.class)
			} else {
				incomingData = incomingData as Map
			}


			// vertx.executeBlocking({ promise ->
				
			// 	promise.complete(result)
			// }, { res ->
			// 	println("The result is: ${res.result()}")
			// })


			try {
				switch(incomingData?.type) {
					case 'toggle':
						result.data = toggleAction(incomingData)
						result.message = 'ok'
						break;
					case 'preinitializeEventBusConnection':
						def shortLivedKey = helperService.generateRandomKey()
						def userIpEntry = shortKeyCache.get(shortLivedKey)
						userIpEntry.userRemoteAddress = (("${routingContext.request().remoteAddress()}").toString())
						result.data = shortLivedKey
						result.message = 'Got remote address ' + result.data
						break;
					case 'checkItemsData':
						result.data = checkItemsData(incomingData)
						result.message = 'ok'
						break;
					case 'checkLogsListData':
						result.data = checkLogsListData(incomingData)
						result.message = 'ok'
						break;
					case 'checkLogsFileData':
						result.data = checkLogsFileData(incomingData)
						result.message = 'ok'
						break;
					case 'checkMachineAvailability':
						result.data = checkMachineAvailability(incomingData)
						result.message = 'ok'
						break;
					case 'checkRegularActionData':
						result.data = checkRegularActionData(incomingData)
						result.message = 'ok'
						break;
					case 'checkSensorAlarmData':
						result.data = checkSensorAlarmData(incomingData)
						result.message = 'ok'
						break;
					case 'checkDelayData':
						result.data = checkDelayData(incomingData)
						result.message = 'ok'
						break;
					case 'setItemData':
						result.data = setItemData(incomingData)
						result.message = 'ok'
						pushEventBusMessage([path: "applicationMessage/", type: 'nodeChange', message: [name: (("setItemData").toString()), type: 'refreshPage', status: 'OK', data: [:]]])
						break;
					case 'setRegularActionData':
						result.data = setRegularActionData(incomingData)
						result.message = 'ok'
						pushEventBusMessage([path: "applicationMessage/", type: 'nodeChange', message: [name: (("setRegularActionData${incomingData?.id}").toString()), type: 'callbackCenter', centerName: 'checkRegularData', status: 'OK', data: incomingData?.id]])
						break;
					case 'setSensorActionData':
						result.data = setSensorActionData(incomingData)
						result.message = 'ok'
						break;
					case 'setSensorAlarmData':
						result.data = setSensorAlarmData(incomingData)
						result.message = 'ok'
						break;
				}
			} catch(Exception e) {
				result.status = 'FAIL'
				result.message = e.toString()
				def errMsg = result.message
				def stackTrace = helperService.getExceptionStackTrace(e)
				if(stackTrace) {
					errMsg = (("${errMsg} -- ${stackTrace}").toString())
					localLogger errMsg
				} 
				writeExceptionToFile(result.message, errMsg)
			}

			if(!result.message) {
				result.status = 'FAIL'
				result.message = 'Unrecognized action'
			}

			def resultObj = new JsonObject(result)
			routingContext.response().putHeader("content-type", "application/json; charset=utf-8").end(resultObj.toString())
		})
	}
	
	private def addPageProps(Map propertiesObj) {
		if(!propertiesObj.pageflags) {
			propertiesObj.pageflags = [:]
		}

		def currDate = new Date()
		def tdExcFileName = "exceptions_${getMinuteKey(currDate, 'YMD')}.log"
		def tdExcFilePath = (("${settingsService.logsFolderPath}exceptions/${tdExcFileName}").toString())

		propertiesObj.pageflags.todayexcexists = helperService.fileExists(tdExcFilePath);
		propertiesObj.pageflags.canChangeAlarmSettings = settingsService.canChangeAlarmSettings;
		propertiesObj.pageflags.serverDateTime = [
			serverTimeStamp: currDate.getTime(),
			serverCompareTime: getMinuteKey(currDate, 'HM')
		]
		propertiesObj.pageflags.logsDropdownFilter = settingsService.logsDropdownFilter;
		propertiesObj.translations = settingsService.translations;
	}

	private def toggleAction(def incomingData) {
		def returnData = signalSenderService.toggleAction(incomingData)
		
		returnData?.notifyIds?.each { notifyIdItem ->
			pushEventBusMessage([path: "applicationMessage/", type: 'nodeChange', message: [name: (("toogle${notifyIdItem}").toString()), type: 'callbackCenter', centerName: 'checkData', status: 'OK', data: notifyIdItem]])
		}

		return returnData.returnData
	}

	private def isSecured() {
		localLogger "temporary isSecured with no implementation"
		return true
	}

	private def checkItemsData(def incomingData) {
		def returnData = [items:[]]

		if(incomingData.category == 'manageitems')
		{
			if(!isSecured()) {
				return returnData
			}
 			// should receive some security just porting now
			if(incomingData.id)
			{
				def item = itemCheckerService.checkItem(incomingData.id);
				
				if(item) {
					returnData.item = item;
				}
			}
			else
			{
				returnData.items = [];
				returnData.itemsDictionary = [];
				
				def items = itemCheckerService.getItems(null);

				items?.each { item ->
					returnData.items << [
						id: item.getProp('name'), 
						image: item.getProp('image'), 
						icon: item.getProp('icon'), 
						header: item.getProp('header'), 
						enabled: item.getProp('enabled')	
					]
					returnData.itemsDictionary << [
						id: item.getProp('name'), 
						header: item.getProp('header'), 
					]
				}
				returnData.folderSecured = false;//isSecured()
			}
		} else if(incomingData.category == 'sensors') {
			def items = sensorCheckerService.getSensors();

			items?.each { item ->
				def filePath = settingsService.sensorSettingsFilesPath + item.id + '.json';
				def sensorInfoText = null;
				localLogger filePath
			
				File sensorsFile = new File(filePath)
				if (sensorsFile.exists()) {
					String fileContent = sensorsFile.text
					item = (new JsonObject(fileContent)).mapTo(Map.class);
					item.customData = true
				}
				returnData.items << [
					id: item.id, 
					header: item.header,
					timeUnits: item.timeUnits,
					on: item.on,
					customData: item.customData ?: null
				]
			}
				
			returnData.itemsDictionary = [];
			def itemsDictionary = itemCheckerService.getItems(null);
			itemsDictionary?.each { itemDictionary ->
				returnData.itemsDictionary << [
					id: itemDictionary.getProp('name'),
					header: itemDictionary.getProp('header')
				]
			}
		} else {
			def items = itemCheckerService.getItems(incomingData.category);
		
			items.each { item ->
				def defaultDelayValue = item.getProp('delay') ? (item.getProp('delay') < 0 ? -1 : Math.ceil(item.getProp('delay')/60)) : null;
				if(item instanceof ItemCheckerService.IntItem)
				{
					returnData.items << [
						id: item.getProp('name'), 
						hotword: item.getProp('hotword'), 
						icon: item.getProp('icon'), 
						image: item.getProp('image'), 
						delay: defaultDelayValue, 
						header: item.getProp('header'), 
						questionOff: item.getProp('questionOff'), 
						questionOn: item.getProp('questionOn'), 
						enableOn: item.getProp('enableOn'), 
						enableOff: item.getProp('enableOff'), 
						regularActions: item.getProp('regularActions'), 
						subtype: "I", 
						enabled: item.getProp('enabled')
					]
				}
				else if(item instanceof ItemCheckerService.GroupItem || item instanceof ItemCheckerService.MacItem)
				{
					def relatedItems = [];
					if(item.getProp('itemIDs')) {
						relatedItems = itemCheckerService.getItemHeaders(item.getProp('itemIDs'));
					}
					returnData.items << [
						id: item.getProp('name'), 
						hotword: item.getProp('hotword'), 
						icon: item.getProp('icon'), 
						image: item.getProp('image'), 
						header: item.getProp('header'), 
						questionOff: item.getProp('questionOff'), 
						questionOn: item.getProp('questionOn'), 
						enableOn: item.getProp('enableOn'), 
						enableOff: item.getProp('enableOff'), 
						regularActions: item.getProp('regularActions'), 
						subtype: ((item instanceof ItemCheckerService.MacItem) ? "M" : "G"), 
						enabled: item.getProp('enabled'),
						relatedItems: relatedItems
					]
				}
			}
		}

		return returnData
	}

	private def checkLogsListData(def incomingData) {
		def returnData = [items:[], allCount: 0]
		def startIndex = incomingData.startIndex?.toInteger() ?:0
		def itemsPerPage = incomingData.itemsPerPage?.toInteger() ?: 10
		def category = incomingData.category ?: null
		def fileTypes = 'log'
		def files = []
		def count = 0

		if(!category || !settingsService.logsFolderPath) {
			return returnData
		}

		def dh = new File((("${settingsService.logsFolderPath}${category}").toString()))
		if(!dh || !dh.isDirectory()) {
			return returnData
		}

		dh.eachFile(FileType.FILES) { fileItemName ->
		// localLogger fileItemName
			def fileItem = new File(("${fileItemName}").toString())
			files << fileItem.getName().toString()
		}

		files = files.sort().reverse()

		files?.eachWithIndex { fileItem, index ->
			if(index >= startIndex && count < itemsPerPage)
			{
				returnData.items << [name: fileItem]
				count++;
			}
		}
		returnData.allCount = files?.size() ?: 0
		return returnData
	}

	private def checkLogsFileData(def incomingData) {
		def returnData = [logLines:[], allCount: 0]
		
		def category = incomingData.category ?: null
		def fileName = incomingData.fileName ?: null

		if(!settingsService.logsFolderPath || !category || !fileName || !fileName.contains('.log')) {
			return returnData
		}

		def dh = new File((("${settingsService.logsFolderPath}${category}/${fileName}").toString()))
		if(!dh || !dh.isFile()) {
			return returnData
		}

		String fileContent = dh.text

		if(!fileContent) {
			return returnData
		}

		returnData.logLines = fileContent.split("\n\r\n")
		if(returnData.logLines?.size() <= 1) {
			returnData.logLines = fileContent.split("\r\n")
		}

		return returnData
	}

	private def checkRegularActionData(def incomingData) {
		def id = incomingData.id
		def returnData = [:]
		if(!id) {
			return returnData
		}

		def item = itemCheckerService.checkItem(id)
		if(!item) {
			return returnData
		}

		if(item.regularActionsData) {
			returnData = item.regularActionsData
		}

		return returnData
	}

	private def checkSensorAlarmData(def incomingData) {
		def returnData = [:]

		if(!isSecured()) {
			return returnData
		}

		def id = incomingData?.id
		if(!id) {
			return returnData
		}
		
		def item = sensorCheckerService.checkSensor(id);	
	
	
		if(!item)
		{
			return returnData
		}

		def fileName = "${item.id}.json"
		def filePath = "${settingsService.sensorSettingsFilesPath}${fileName}";	

		File sensorsCustomSettingsFile = new File(filePath)
		if (sensorsCustomSettingsFile.exists()) {
			String fileContent = sensorsCustomSettingsFile.text
			item = (new JsonObject(fileContent)).mapTo(Map.class);
			item.customData = true
		}

		returnData = [
			id: item.id, 
			alarmTimeUnits: item.alarmTimeUnits, 
			onAlarm: item.onAlarm, 
			customData: item.customData ?: null, 
			folderSecured: false
		]
		
		return returnData
	}

	private def setItemData(def incomingData) {
		if(!isSecured()) {
			return null
		}

		def incomingDataItem = (new JsonObject(incomingData?.item)).mapTo(Map.class);
		if(incomingDataItem?.name == null || incomingDataItem?.header == null || incomingDataItem?.category == null || incomingDataItem?.__processAction == null) {
			throw new Exception((("Incorrect setItemData args ${incomingDataItem}").toString()))
		}

		def nodesMap
        File nodesFile = new File(settingsService.nodesFilePath)
        if (nodesFile.exists()) {
            String fileContent = nodesFile.text
            nodesMap = (new JsonObject(fileContent)).mapTo(Map.class);
        } else {
            throw new Exception("config file for nodes ${filePath} does not exist !!!")
        }

		if(!nodesMap.nodes) {
			nodesMap.nodes = []
		}

		if(incomingDataItem.__processAction == 0) {
			// edit
			incomingDataItem.remove('__processAction')
			def existingItem = nodesMap?.nodes?.find { incomingDataItem.name == it.name}
			if(existingItem) {
				def keysToRemove = []
				existingItem.each { key, value ->
					keysToRemove << key
				}
				keysToRemove.each {
					existingItem.remove(it)
				}
				existingItem.putAll(incomingDataItem)
			}
		} else if(incomingDataItem.__processAction == 1) {
			// add
			incomingDataItem.remove('__processAction')
			nodesMap.nodes << incomingDataItem
		} else if(incomingDataItem.__processAction == 2) {
			// delete
			nodesMap.nodes = nodesMap.nodes.findAll { incomingDataItem.name != it.name }
		} else {
			throw new Exception("unrecognized item edit action ${incomingDataItem.__processAction }")
		}

		def reorderNodes = {index, nodes ->
			def node = nodes[index];
			if(!node.__reorder)
				return;
				
			if(node.__reorder == -1 && index != 0) {
				// first
				node.remove('__reorder');
				nodes.remove(index)
				nodes.add(0, node)
			}
			else if(node.__reorder == 99) {
				node.remove('__reorder');
				nodes.remove(index)
				nodes << node
			}
			else {
				// after something
				def indexAfter = 0;
				def noMore = false
				nodes.each{ item ->
					if(noMore) {
						return
					} 
					if(item.name == node.__reorder) {
						noMore = true
					}
					indexAfter++
				}

				
				if(indexAfter != index) {
					nodes.remove(index)
					if(indexAfter > index) {
						indexAfter--;
					}
					
					node.remove('__reorder');
					nodes.add(indexAfter, node)
				}
			}
		}

		def checkIndexes = []
		nodesMap?.nodes?.eachWithIndex { existingItem, index ->
			if(existingItem.__reorder) {
				checkIndexes << index
			} 
		}
		checkIndexes?.each {
			reorderNodes(it, nodesMap?.nodes)
		}

		JsonObject jsonObj = new JsonObject(nodesMap);
		def jsonString = jsonObj.toString()
		File file = new File(settingsService.nodesFilePath);
		FileWriter fw = new FileWriter(file.getAbsoluteFile());
		BufferedWriter bw = new BufferedWriter(fw);
		bw.write(jsonString);
		bw.close();

		itemCheckerService.loadItemNodes()
	}

	private def setSensorActionData(def incomingData) {

		if(!isSecured()) {
			return null
		}

		def id = incomingData?.id ?: null
		def timeLine = incomingData?.timeLine ?: null
		def onDevices = incomingData?.onDevices != null ? incomingData?.onDevices : null

		if(!id) {
			return returnData
		}

		def item = sensorCheckerService.checkSensor(id)

		if(!settingsService.sensorSettingsFilesPath) {
			localLogger "No sensoractionfiles dir defined"
			return returnData
		}

		def fileName = "${item.id}.json"
		def filePath = "${settingsService.sensorSettingsFilesPath}${fileName}";	

		File sensorsCustomSettingsFile = new File(filePath)
		if (sensorsCustomSettingsFile.exists()) {
			String fileContent = sensorsCustomSettingsFile.text
			item = (new JsonObject(fileContent)).mapTo(Map.class);
		}

		if(timeLine) {
			def timeUnits = timeLine.split('\\|')
			def index = 0;
			def timesArray = [];
			
			timeUnits?.each { timeUnitLine ->
				def timeUnitData = timeUnitLine.split("#")
				if(timeUnitData?.size() < 3) {
					return
				}
				def timeUnit = [
					timeStart: timeUnitData[0],
					timeEnd: timeUnitData[1],
					daysOfWeek: timeUnitData[2]
				]
				if(timeUnitData.size() > 3) {
					timeUnit.random = helperService.toBoolean(timeUnitData[3])
				}
				timesArray << timeUnit
			} 

			item.timeUnits = timesArray
			JsonObject jsonObj = new JsonObject(item);
			def sensorJson = jsonObj.toString()
			helperService.writeFile(settingsService.sensorSettingsFilesPath, fileName, sensorJson)
		} else if(onDevices) {
			item.onDevices = onDevices
			JsonObject jsonObj = new JsonObject(item);
			def sensorJson = jsonObj.toString()
			helperService.writeFile(settingsService.sensorSettingsFilesPath, fileName, sensorJson)
		} else {
            if(sensorsCustomSettingsFile && sensorsCustomSettingsFile.isFile() && sensorsCustomSettingsFile.exists()) {
				sensorsCustomSettingsFile.delete()
			}
		}
	}

	private def setSensorAlarmData(def incomingData) {
		def returnData = [:]

		if(!isSecured()) {
			return returnData
		}

		def id = incomingData?.id ?: null
		def timeLine = incomingData?.timeLine ?: null
		def onDevices = incomingData?.onDevices != null ? incomingData?.onDevices : null

		if(!id) {
			return returnData
		}

		def item = sensorCheckerService.checkSensor(id)

		if(!settingsService.sensorSettingsFilesPath) {
			localLogger "No sensoractionfiles dir defined"
			return null
		}

		def fileName = "${item.id}.json"
		def filePath = "${settingsService.sensorSettingsFilesPath}${fileName}";	

		File sensorsCustomSettingsFile = new File(filePath)
		if (sensorsCustomSettingsFile.exists()) {
			String fileContent = sensorsCustomSettingsFile.text
			item = (new JsonObject(fileContent)).mapTo(Map.class);
		}

		if(timeLine) {
			def timeUnits = timeLine.split('\\|')
			def index = 0;
			def timesArray = [];
			
			timeUnits?.each { timeUnitLine ->
				def timeUnitData = timeUnitLine.split("#")
				if(timeUnitData?.size() < 3) {
					return
				}
				def timeUnit = [
					timeStart: timeUnitData[0],
					timeEnd: timeUnitData[1],
					daysOfWeek: timeUnitData[2]
				]
				if(timeUnitData.size() > 3) {
					timeUnit.random = helperService.toBoolean(timeUnitData[3])
				}
				timesArray << timeUnit
			} 

			item.alarmTimeUnits = timesArray
			JsonObject jsonObj = new JsonObject(item);
			def sensorJson = jsonObj.toString()
			helperService.writeFile(settingsService.sensorSettingsFilesPath, fileName, sensorJson)
		} else if(onDevices != null) {
			item.onAlarm = onDevices
			JsonObject jsonObj = new JsonObject(item);
			def sensorJson = jsonObj.toString()
			helperService.writeFile(settingsService.sensorSettingsFilesPath, fileName, sensorJson)
		} 
		// else {
        //     if(sensorsCustomSettingsFile && sensorsCustomSettingsFile.isFile() && sensorsCustomSettingsFile.exists()) {
		// 		sensorsCustomSettingsFile.delete()
		// 	}
		// }

		return returnData
	}

	private def checkDelayData(def incomingData) {
		def id = incomingData.id
		def returnData = [:]
		if(!id) {
			return returnData
		}

		def item = itemCheckerService.checkItem(id)
		if(!item) {
			return returnData
		}

		if(item.delayData && itemCheckerService.isDelayStillValid(item.delayData)) {
			returnData = item.delayData.mapTo(Map.class)
			returnData = returnData ?: [:]
		}

		if(item instanceof ItemCheckerService.WebItem)
		{
			try {
				def pageContent = helperService.getWebPageContent([url: item.UrlWithCheck()]);
			
				def delayInfoTextObject = [:]
				
				returnData = returnData ?: [:]
				if(pageContent) {
					def data = new JsonObject(pageContent).mapTo(Map.class)
					returnData.enabled = data.pin1;
				}
				else {
					returnData.enabled = null;
				}
			} catch(Exception e) {
				localLogger '!!! checkDelayData inner exception'
				localLogger e
			}
		}

		// localLogger returnData
		return returnData
	}

	private def checkMachineAvailability(def incomingData) {
		def returnData = [:]
		def id = incomingData.id
		def timeLine = incomingData.timeLine

		if(!id) {
			return returnData
		}

		def item = itemCheckerService.checkItem(id)
		if(!item) {
			return returnData
		}

		// tbd later does not seem to work
		// cat /proc/net/arp | grep c4:e9:84:91:c3:25 | cut -d ' ' -f 1
		def getIpCommand = ["cat", '/proc/net/arp', '|', 'grep', item.CodeOn().toLowerCase(), '|', 'cut', '-d', "' '", '-f', '1']
		def ipResult = helperService.runShellCommand(getIpCommand)
		localLogger "getIpCommand: ${ipResult}"

		if(ipResult) {
			def ipCommand = "ping ${ipResult} -w 1"

			def pingResult = helperService.runShellCommand(ipCommand.split(' '))
			if(pingResult?.contains('1 received')) {
				returnData.available = true
			}
		}

		return returnData
	}

	private def setRegularActionData(def incomingData) {
		def id = incomingData.id
		def timeLine = incomingData.timeLine

		if(!id) {
			return
		}

		def item = itemCheckerService.checkItem(id)
		if(!item) {
			return
		}

		def fileName = "${item.getProp('name')}_regular_action.json"
		
		if(timeLine) {
			def timeUnits = timeLine.split('\\|')
			def index = 0;
			def timesArray = [];
			
			timeUnits?.each { timeUnitLine ->
				def timeUnitData = timeUnitLine.split("#")
				if(timeUnitData?.size() < 3) {
					return
				}
				def timeUnit = [
					timeStart: timeUnitData[0],
					timeEnd: timeUnitData[1],
					daysOfWeek: timeUnitData[2]
				]
				if(timeUnitData.size() > 3) {
					timeUnit.random = helperService.toBoolean(timeUnitData[3])
				}
				timesArray << timeUnit
			} 

			def regularActionData = [
				name: item.getProp('name'),
				timeUnits: timesArray,
				delay: item.getProp('delay')
			]
			JsonObject jsonObj = new JsonObject(regularActionData);
			def timeLineJson = jsonObj.toString()
			helperService.writeFile(settingsService.regularactionFilesPath, fileName, timeLineJson)
			item.regularActionsData = jsonObj
			item.regularActionRandomStart = null
			item.regularActionRandomEnd = null
		} else {
			def filePath = (("${settingsService.regularactionFilesPath}${fileName}").toString())
			def dh = new File(filePath)
            if(dh && dh.isFile() && dh.exists()) {
				dh.delete()
			}
			item.regularActionsData = null
		}
	}

	private void sendApplicationExceptionMessage(def exception) {
		try {
			pushEventBusMessage([path: "applicationMessage/", type: 'warning', message: [name: 'sendApplicationExceptionMessage', type: 'applicationWarningTextMessage', status: 'FAIL', data: exception?.toString() ?: '']])
		} catch(Exception e) {
			localLogger 'sendApplicationExceptionMessage Exception !!!'
			localLogger e
		}
	}

	private void writeExceptionToFile(def exceptionShort, def exceptionLong) {
		try {
			sendApplicationExceptionMessage(exceptionShort)
			def currentExcData = "${dateFormat2.format(new Date())}:${exceptionShort?.toString() ?: ''}${exceptionLong?.toString() ?: ''}"
			def fileName = "exceptions_${getMinuteKey(new Date(), 'YMD')}.log"
			def filePath = (("${settingsService.logsFolderPath}exceptions/${fileName}").toString())
			def dh = new File(filePath)
			if(!dh || !dh.isFile() || !dh.text) {
				
			} else {
				currentExcData = (("${currentExcData}\n\r\n${dh.text}").toString())
			}

			Buffer buff = Buffer.buffer(currentExcData);

			vertx.fileSystem().writeFile(filePath, buff, 
			new Handler<AsyncResult<Void>>() {
				@Override
				public void handle(AsyncResult<Void> result) {
					if(result.succeeded()) {
						def textMessage = (("Exception file ${fileName} saved successfully").toString())
						localLogger textMessage
					} else {
						def textMessage = (("Exception file ${fileName} save failed !!!").toString())
						localLogger textMessage
					}
				}
			});
		} catch(Exception e) {
			localLogger 'writeExceptionToFile Exception !!!'
			localLogger e
		}
	}

	private void prepareWebsocketServer() {
		localLogger 'prepareWebsocketServer'

		router.route("/${settingsService.eventBusPath}/*").handler(eventBusHandler());
		
		def eb = vertx.eventBus()

		// Register to listen for messages coming IN to the server
		eb.consumer("register/").handler({ message ->
			localLogger 'Registering register message: ' << message.body()

			def bodyObject

			if(message.body() instanceof JsonObject) {
				bodyObject = message.body().mapTo(Map.class)
			} else {
				bodyObject = message.body()
			}

			if(bodyObject.registeringPage == true) {
				def sessionId = bodyObject.sessionId
				def initializeKey = bodyObject.initializeKey
				if(!initializeKey) {
					localLogger 'No Initialize Key!!!'
					message.reply(new JsonObject([status: 'failure', reason: 'initialize Key not present']))
					return
				}
				def userPreinitializeData = shortKeyCache.get(initializeKey)
				if(!userPreinitializeData || !userPreinitializeData.userRemoteAddress) {
					localLogger 'Initialize Key Incorrect!!!'
					message.reply(new JsonObject([status: 'failure', reason: 'initialize Key incrorrect']))
					return
				}
				if(sessionId) {
					registeredHandles[(sessionId)] = [activityDate: new Date(), userRemoteAddress: userPreinitializeData.userRemoteAddress]
					localLogger "registeredHandles: ${registeredHandles}"
					def bodyObj = [status: 'success', handle: sessionId]
					addPageProps(bodyObj)
					message.reply(new JsonObject(bodyObj))
				} else {
					message.reply(new JsonObject([status: 'failure']))
				}
			} else if(bodyObject.criteriaChanged == true) {
				def sessionId = bodyObject.sessionId
				if(sessionId) {
					if(registeredHandles[(sessionId)]) {
						def bodyObj = [status: 'success', handle: sessionId]
						addPageProps(bodyObj)
						message.reply(new JsonObject(bodyObj))
					} else {
						localLogger "sessionId ${sessionId} does not figure in registered sessions!"
					}
				} else {
					localLogger "no sessionId to update criteria"
				}
			} else if(bodyObject.updatingSession == true) {
				def sessionId = bodyObject.sessionId
				if(sessionId) {
					if(registeredHandles[(sessionId)]) {
						registeredHandles[(sessionId)].activityDate = new Date()
					} else {
						localLogger "sessionId ${sessionId} does not figure in registered sessions!"
					}
				} else {
					localLogger "no sessionId to update"
				}
			}
		})
	}

	private def performKeyCacheSearch(def message) {
		def bodyObject

		if(message instanceof JsonObject) {
			bodyObject = message.mapTo(Map.class)
		} else {
			bodyObject = message
		}

		def searchResults = [:]
		def filterByType = bodyObject?.searchCriteria?.type
		def filterByText = bodyObject?.searchCriteria?.text
		def currentKeyCache = cacheByKeyContainer.asMap()

		if(!filterByText || !currentKeyCache) {
			return searchResults
		}

		if(filterByText.startsWith('HZ')) {
			filterByText = Math.abs((filterByText ?: 'unknown').hashCode()).toString()
			localLogger "HZ text detected. Translating ..."
		}

		def filterByParts = filterByText.split(',')
		currentKeyCache.each { key, value ->
			if(filterByType) {
				if(!key.startsWith(filterByType + '_')) {
					return
				}

				def foundRes = filterByParts.find { filterByPartsItem ->
					return key.contains(filterByPartsItem.trim())
				}
				if(foundRes) {
					searchResults[(key)] = value
				}

			} else {
				if(key.startsWith('counter_')) {
					return
				}
				def foundRes = filterByParts.find { filterByPartsItem ->
					return key.contains(filterByPartsItem.trim())
				}
				if(foundRes) {
					searchResults[(key)] = value
				}
			}
		}
		return searchResults
	}

	private void pushEventBusMessage(def args = [:]) {
		def path = args.path 
		def message = args.message
		def type = args.type
		// localLogger "pushEventBusMessage ${path}" 
		// localLogger "pushEventBusMessage ${path} ${message}" 
		// update no more often than eventBusMessagesDelay s
		
		def notificationKey = "${path}${message.name}"		
		def sendToEventBus = { messageToBeSent ->
			registeredHandles.each { sessionIdKey, sessionIdValue ->

				def eventBusMessage = new JsonObject(message)

				localLogger ("Fire websocket update for ${path}${sessionIdKey} -> ${notificationKey}")
				scheduledUpdates[notificationKey] = null
				def eb = vertx.eventBus()
				eb.publish(path+sessionIdKey, eventBusMessage)
			}
		}

		if (scheduledUpdates[notificationKey] != null) {
			def timerData = scheduledUpdates[notificationKey]
			if (timerData.timerId != null) {
				// localLogger (('Canceling existing notification timer for key ' << notificationKey).toString())
				timerData.timerDelayedTimes ++
				vertx.cancelTimer(timerData.timerId)   
				if(timerData.timerDelayedTimes > 30) {
					sendToEventBus(message)
					return
				}
			}
		}

		// localLogger 'Setup new timer'
		scheduledUpdates[notificationKey] = [
			timerDelayedTimes: 0,
			timerId: (
				vertx.setTimer(settingsService.eventBusMessagesDelay, { timerId ->
					sendToEventBus(message)
				})
			)
		] 
	}
		
	private SockJSHandler eventBusHandler() {
		BridgeOptions bridgeOptions = new BridgeOptions()
				.addOutboundPermitted(new PermittedOptions().setAddressRegex('^(applicationMessage\\/).*$'))
				.addInboundPermitted(new PermittedOptions().setAddress('register/'));
				// .addInboundPermitted(new PermittedOptions().setAddress('searchKeyWarnings/'));

		def socketJSHandler = SockJSHandler.create(vertx)
		socketJSHandler.bridge(bridgeOptions)

		return socketJSHandler
		// return SockJSHandler.create(vertx).bridge( bridgeOptions, { bridgeEvent -> 
		// 	if (bridgeEvent.type() == BridgeEventType.SOCKET_CREATED) {
		// 		localLogger("A socket was created");
		// 	}
		// 	bridgeEvent.complete(true);
		// });
	}

	private String getDayKey(Date timestamp) {
		if (timestamp == null) { 
			timestamp = new Date()
		}
		
		Calendar calendar = GregorianCalendar.getInstance(TimeZone.getTimeZone("GMT"))
		calendar.setTime(timestamp)
		def year = calendar.get(Calendar.YEAR)
		def month = calendar.get(Calendar.MONTH) + 1
		def day = calendar.get(Calendar.DAY_OF_MONTH)
		
		return ('' << (year as String).padLeft(4, '0') << (month as String).padLeft(2, '0') << (day as String).padLeft(2, '0'))
	}

	private String getMinuteKey(Date timestamp, def format = null) {
		if (timestamp == null) { 
			timestamp = new Date()
		}
		
		Calendar calendar = GregorianCalendar.getInstance(TimeZone.getTimeZone("GMT"))
		calendar.setTime(timestamp)
		def year = calendar.get(Calendar.YEAR)
		def month = calendar.get(Calendar.MONTH) + 1
		def day = calendar.get(Calendar.DAY_OF_MONTH)
		def hour = calendar.get(Calendar.HOUR_OF_DAY)
		def minute = calendar.get(Calendar.MINUTE)
		def second = calendar.get(Calendar.SECOND)
		
		if(format == 'YMDHMS') {
			return ('' << (year as String).padLeft(4, '0') << (month as String).padLeft(2, '0') << (day as String).padLeft(2, '0') << (hour as String).padLeft(2, '0') << (minute as String).padLeft(2, '0') << (second as String).padLeft(2, '0'))
		} else if(format == 'YMDHM') { 
			return ('' << (year as String).padLeft(4, '0') << (month as String).padLeft(2, '0') << (day as String).padLeft(2, '0') << (hour as String).padLeft(2, '0') << (minute as String).padLeft(2, '0'))
		} else if(format == 'YMD') { 
			return ('' << (year as String).padLeft(4, '0') << (month as String).padLeft(2, '0') << (day as String).padLeft(2, '0'))
		} else if(format == 'HM') { 
			return ('' << (hour as String).padLeft(2, '0') << (minute as String).padLeft(2, '0'))
		} else {
			return ('' << (hour as String).padLeft(2, '0') << (minute as String).padLeft(2, '0'))
		}
	}


	void localLogger(def message, def onlyDev = false) {
		logger.info((((message).toString()) << '\n').toString())
	}
}
