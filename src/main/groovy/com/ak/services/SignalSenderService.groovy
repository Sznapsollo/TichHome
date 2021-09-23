package com.ak.services

import io.vertx.core.logging.Logger
import io.vertx.core.json.JsonObject
import java.text.SimpleDateFormat

import com.ak.services.ItemCheckerService
import com.ak.services.HelperService

import static com.ak.services.HelperService.toString

class SignalSenderService {
    Logger logger = io.vertx.core.logging.LoggerFactory.getLogger('MyMainGroovyVerticle')

	SimpleDateFormat logFileNameDateFormat = new SimpleDateFormat("yyyyMMdd")
	SimpleDateFormat logLineDateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss")

	HelperService helperService
    private def delayFilesPath
	private def processesFilesPath
	private def codeSendPath
	private def conradCodeSendPath
	private def saveDailyLogsToFile
	private def saveDailySensorLogsToFile
	private def webServerAddress
	private def satelliteServerAddresses
	private def logsFolderPath
	private def vertxReference
	private def itemCheckerService
	
	// def sudo = "sudo "
	def sudo = ""
	private Map actions = [:]
	private Map scheduledActions = [:]

	SignalSenderService() {}
    SignalSenderService(def vertx, def settingsServiceRef, def itemCheckerServiceRef, def actionsRef) {
		vertxReference = vertx
        delayFilesPath = settingsServiceRef.delayFilesPath
		processesFilesPath = settingsServiceRef.processesFilesPath
		codeSendPath = settingsServiceRef.codeSendPath
		conradCodeSendPath = settingsServiceRef.conradCodeSendPath
		saveDailyLogsToFile = settingsServiceRef.saveDailyLogsToFile
		saveDailySensorLogsToFile = settingsServiceRef.saveDailySensorLogsToFile
		webServerAddress = settingsServiceRef.webServerAddress
		satelliteServerAddresses = settingsServiceRef.satelliteServerAddresses
		logsFolderPath = settingsServiceRef.logsFolderPath
		helperService = new HelperService()
		itemCheckerService = itemCheckerServiceRef
		actions = actionsRef as Map

		initDelayedProcesses()
    }

	def toggleAction(def incomingData) {
		def returnData = [notifyIds: []]
		def shouldLogToggleAction = true

		def outletLight = incomingData.outletId
		def outletStatus = incomingData.outletStatus
		def outletDelayed = incomingData.outletDelayed ?: 0
		def outletSource = incomingData.outletSource
		def remoteAddress = incomingData.remoteAddress

		try {
			if(outletDelayed != null) {
				outletDelayed = HelperService.manageDelayValue(outletDelayed)
			}
		} catch(Exception e) {
			outletDelayed = 0
			localLogger "!!! Invalid outletDelayed value ${outletDelayed}"
		}

		if(!outletLight) {
			return	returnData
		}

		returnData.notifyIds << outletLight

		def itemToProcess = itemCheckerService.checkItem(outletLight);
		if(!itemToProcess) {
			return returnData
		}

		if(outletStatus == "on" && outletSource == "Sensor") {
			def scheduledActionKey = toString('delayProcess_' + itemToProcess.getProp('name'))
			if(scheduledActions[scheduledActionKey] != null) {
				def timerData = scheduledActions[scheduledActionKey]
				if (timerData.timerId != null) {
					// there is pending delay process for this item so its ON
					localLogger "Detected Sensor ON signal for device ${outletLight}. Switching to offd."
					outletStatus = "offd"
					shouldLogToggleAction = false
				}
			}
		}

		itemToProcess.processingStatus = outletStatus;
		itemToProcess.processingSource = outletSource ?: "-";

		if(outletStatus == "on") {
			if(itemToProcess instanceof ItemCheckerService.GroupItem) {
				if(shouldLogToggleAction) {
					logToggleAction([outletLight:outletLight, outletDelayed:outletDelayed, outletStatus:outletStatus, outletSource:outletSource, remoteAddress: remoteAddress])
				}
				itemToProcess.getProp('itemIDs')?.each { code ->
					returnData.notifyIds << code
					def subItemToProcess = itemCheckerService.checkItem(code);
					if(!subItemToProcess) {
						return
					}
					subItemToProcess.processingStatus = outletStatus;
					subItemToProcess.processingSource = outletSource ?: "-";
					enableItem(subItemToProcess, outletDelayed);
					if(shouldLogToggleAction) {
						logToggleAction([outletLight:code, outletDelayed:outletDelayed, outletStatus:outletStatus, outletSource: 'Group', remoteAddress: remoteAddress])
					}
					Thread.sleep(1000);
				}
			}
			else if(itemToProcess instanceof ItemCheckerService.IntItem) {
				enableItem(itemToProcess, outletDelayed);
				if(shouldLogToggleAction) {
					logToggleAction([outletLight:outletLight, outletDelayed:outletDelayed, outletStatus:outletStatus, outletSource:outletSource, remoteAddress: remoteAddress])
				}
			}
			else if(itemToProcess instanceof ItemCheckerService.MacItem) {
				turnComputerOn(itemToProcess.CodeOn()); 
				if(shouldLogToggleAction) {
					logToggleAction([outletLight:outletLight, outletDelayed:outletDelayed, outletStatus:outletStatus, outletSource:outletSource, remoteAddress: remoteAddress])
				}
			}
		}
		else if (outletStatus == "off") {
			if(itemToProcess instanceof ItemCheckerService.GroupItem) {
				if(shouldLogToggleAction) {
					logToggleAction([outletLight:outletLight, outletDelayed:outletDelayed, outletStatus:outletStatus, outletSource:outletSource, remoteAddress: remoteAddress])
				}
				itemToProcess.getProp('itemIDs')?.each { code ->
					returnData.notifyIds << code
					def subItemToProcess = itemCheckerService.checkItem(code);
					if(!subItemToProcess) {
						return
					}
					subItemToProcess.processingStatus = outletStatus;
					subItemToProcess.processingSource = outletSource ?: "-";
					disableItem(subItemToProcess);
					if(shouldLogToggleAction) {
						logToggleAction([outletLight:code, outletDelayed:outletDelayed, outletStatus:outletStatus, outletSource: 'Group', remoteAddress: remoteAddress])
					}
					Thread.sleep(1000);
				}
			}
			else if(itemToProcess instanceof ItemCheckerService.IntItem) {
				disableItem(itemToProcess);
				if(shouldLogToggleAction) {
					logToggleAction([outletLight:outletLight, outletDelayed:outletDelayed, outletStatus:outletStatus, outletSource:outletSource, remoteAddress: remoteAddress])
				}
			}
		}
		else if(outletStatus == "offd") {
			if(itemToProcess instanceof ItemCheckerService.IntItem) {
				delayedDisableItem(itemToProcess, outletDelayed);
				if(shouldLogToggleAction) {
					logToggleAction([outletLight:outletLight, outletDelayed:outletDelayed, outletStatus:outletStatus, outletSource:outletSource, remoteAddress: remoteAddress])
				}
			}
		}

		return returnData
	}

	def logToggleAction(def args) {

		def outletLight = args.outletLight
		def outletDelayed = args.outletDelayed
		def outletStatus = args.outletStatus
		def outletSource = args.outletSource
		def remoteAddress = args.remoteAddress

		def sourceMsg = ""
		if(remoteAddress) {
			sourceMsg = "${outletSource ?: '#'} - ${remoteAddress ?: '#'}"
		} else {
			sourceMsg = "${outletSource ?: '#'}"
		}

		if(saveDailyLogsToFile) {
			def currDate = new Date()
			def logBody = toString("${logLineDateFormat.format(currDate)}: device ${outletLight}, delay=${outletDelayed}, status=${outletStatus}, source=${sourceMsg}")
			def logsFileName = "actions_${logFileNameDateFormat.format(currDate)}.log"
			def actionsLogFolderPath = toString("${logsFolderPath}/actions/")
			helperService.appendFile(actionsLogFolderPath, logsFileName, logBody)
		}

		if(saveDailySensorLogsToFile && outletStatus == "on" && outletSource == "Sensor") {
			def currDate = new Date()
			def logBody = toString("${logLineDateFormat.format(currDate)}: device ${outletLight}, delay=${outletDelayed}, status=${outletStatus}, source=${sourceMsg}")
			def logsFileName = "sensors_${logFileNameDateFormat.format(currDate)}.log"
			def actionsLogFolderPath = toString("${logsFolderPath}/sensors/")
			helperService.appendFile(actionsLogFolderPath, logsFileName, logBody)
		}
	}

	def enableItem(def item, def outletDelayed)
	{	
		if(!item.getProp('enabled'))
			return;
			
		if(item instanceof ItemCheckerService.WebItem) {
			enableWebItem(item, outletDelayed);
		} else if(item instanceof ItemCheckerService.ShellItem) {
			enableShellItem(item, outletDelayed);
		} else if(item instanceof ItemCheckerService.IntItem) {
			enableRadioItem(item, outletDelayed);
		}

		notifySatellites(item, 'on', outletDelayed)
	}

	def disableItem(def item)
	{
		if(item.regularActionRandomStart) {
			item.regularActionRandomStart = null
		}
		if(item.regularActionRandomEnd) {
			item.regularActionRandomEnd = null
		}

		if(item instanceof ItemCheckerService.WebItem) {
			disableWebItem(item);
		} else if(item instanceof ItemCheckerService.ShellItem) {
			disableShellItem(item);
		} else if(item instanceof ItemCheckerService.IntItem) {
			disableRadioItem(item);
		}

		notifySatellites(item, 'off', 0)
	}

	def delayedDisableItem(def item, def outletDelayed)
	{
		if(item instanceof ItemCheckerService.WebItem) {
			delayedDisableWebItem(item, outletDelayed);
		} else if(item instanceof ItemCheckerService.IntItem) {
			delayedDisableRadioItem(item, outletDelayed);
		}
		notifySatellites(item, 'offd', outletDelayed)
	}

	def turnComputerOn(def macaddress)
	{
		vertxReference.executeBlocking({ promise ->
			runShellCommand(toString("${sudo}wakeonlan ${macaddress}"), false);		
			promise.complete([OK: true])
		}, { res ->
			localLogger ("turnComputerOn - The result is: ${res.result()}")
		})
	}

	def killDelayProcess(def item)
	{
		def scheduledActionKey = toString('delayProcess_' + item.getProp('name'))

		if(scheduledActions[scheduledActionKey] != null) {
			def timerData = scheduledActions[scheduledActionKey]
			if (timerData.timerId != null) {
				// localLogger (('Canceling existing scheduledAction timer for key ' << scheduledActionKey).toString())
				vertxReference.cancelTimer(timerData.timerId)   
				scheduledActions[scheduledActionKey] = null
			}
		}
		deleteDelayFile(item.getProp('name'));
		item.delayData = null
	}

	def notifySatellites(item, outletStatus, seconds)
	{
		if(!webServerAddress || !satelliteServerAddresses) {
			return
		}

		def notifySatellites = item.getProp('notifySatellites') != null ? item.getProp('notifySatellites') : true;
		if(notifySatellites) {
			def data = [
				type: 'toggle',
				outletId: item.getProp('name'),
				outletStatus: outletStatus,
				outletDelayed: seconds,
				outletSource: webServerAddress
			]

			satelliteServerAddresses.each { satelliteServerAddressItem ->
				if(webServerAddress == satelliteServerAddressItem) {
					localLogger 'Same address as satellite. returning to avoid loop ...'
					return
				}
				def serverAddress = toString("${satelliteServerAddressItem}actions")
				def page = helperService.getWebPageContent([url: serverAddress, method: 'POST', data: (new JsonObject(data)).toString()]);	
			}
		}
	}

	def initDelayedProcesses() {
		try {
			def items = itemCheckerService.getItems(null)

			items?.each { item ->
				if(!item.delayData) {
					return
				}
				try {
					def mapData = item.delayData?.mapTo(Map.class)
					if(!mapData) {
						return false
					}

					def currTime = (new Date()).getTime() / 1000L

					def secondsRemaining = Math.round((mapData?.time + mapData?.delay) - currTime)
						
					localLogger "initDelayedProcesses: for ${item.getProp('name')} secondsRemaining: ${secondsRemaining}"
					delayProcess(item, secondsRemaining, 'off')
				} catch(Exception inEx) {
					localLogger "Exception initDelayedProcesses"
					localLogger inEx
					inEx.printStackTrace();
					delayProcess(item, -1, 'off')
				}
			}
        } catch(Exception e) {
            localLogger "!!! initDelayedProcesses Exception ${e}"
        }
	}

	def delayProcess(def item, def seconds, def action)
	{
		killDelayProcess(item);

		if(!(seconds > 0)) {
			return null
		}
		localLogger 'aaaaa222'

		def scheduledActionKey = toString('delayProcess_' + item.getProp('name'))

		localLogger 'Setup new timer' << seconds
		scheduledActions[scheduledActionKey] = [
			timerId: (
				vertxReference.setTimer(seconds * 1000L, { timerId ->
					scheduledActions[scheduledActionKey] = null
					toggleAction([
						outletId: item.getProp('name'),
						outletStatus: action,
						outletDelayed: 0,
						outletSource: item.processingSource + '(AUTO)'
					])
				})
			)
		]

		saveDelayFile(item, seconds);
	}

	def radioItemScriptPath(item)
	{
		def runRadioSwitchPath = toString("${processesFilesPath}./run_radio_switch.py ");
		
		if(item.getProp('sendOption') == ItemCheckerService.StandardRadioSignal) {
			return toString("${sudo}python ${runRadioSwitchPath}${codeSendPath}");
		} else if(item.getProp('sendOption') == ItemCheckerService.ConradRadioSignal) {
			return toString("${sudo}python ${runRadioSwitchPath}${conradCodeSendPath}");
		}
	}

	def enableRadioItem(item, outletDelayed)
	{
		def codeOn = item.getProp('codeOn')
		codeOn?.each { code ->
			runShellCommand(toString("${radioItemScriptPath(item)} ${code}"));
		}
	
		itemDelaySetUp(item, outletDelayed);
	}

	def disableRadioItem(def item)
	{
		killDelayProcess(item);
		runShellCommand(toString("${radioItemScriptPath(item)} ${item.getProp('codeOff')}"));
	}

	def delayedDisableRadioItem(def item, def outletDelayed)
	{
		itemDelaySetUp(item, outletDelayed);
	}

	def enableWebItem(def item, def outletDelayed)
	{
		def codeOn = item.getProp('codeOn')
		codeOn?.each { code ->
			def page = helperService.getWebPageContent([url: item.UrlWithCode(code)]);
			localLogger "enableWebItem - ${page}"
		}
	
		itemDelaySetUp(item, outletDelayed);
	}

	def disableWebItem(item)
	{
		killDelayProcess(item);
		def page = helperService.getWebPageContent([url: item.CodeOff()]);
		localLogger "disableWebItem - ${page}"
	}

	def enableShellItem(item, outletDelayed)
	{
		def codeOn = item.getProp('codeOn')
		codeOn?.each { code ->
			runShellCommand(code);
		}
		
		itemDelaySetUp(item, outletDelayed);
	}

	def disableShellItem(def item)
	{
		killDelayProcess(item);
		runShellCommand(item.getProp('codeOff'));
	}

	def delayedDisableWebItem(def item, def outletDelayed)
	{
		itemDelaySetUp(item, outletDelayed);
	}

	def itemDelaySetUp(def item, def outletDelayed)
	{
		def defaultDelay = item.getProp('delay');
		if(outletDelayed) {
			def checkSeconds = outletDelayed.toString()
			if(checkSeconds.isNumber()) {
				defaultDelay = outletDelayed;
			}
		}
		
		delayProcess(item, defaultDelay, "off")
	}

	def runShellCommandNoWait(def command) {
		localLogger '-------------------------------------------------------------'
		localLogger "runShellCommandNoWait: ${command}"
		localLogger '-------------------------------------------------------------'
		
		if(command?.startsWith('[namedMethod]')) {
			def action = command.minus('[namedMethod]')
			if(action && this.actions[(action)]) {
				this.actions[(action)]()
				return
			}
		}
		
		helperService.runShellCommandNoWait(command.split(' '))
	}
	def runShellCommand(def command, def sleep = true)
	{
		// shell_exec($command);
		localLogger '-------------------------------------------------------------'
		localLogger "runShellCommand: ${command}"
		localLogger '-------------------------------------------------------------'
		
		if(command?.startsWith('[namedMethod]')) {
			def action = command.minus('[namedMethod]')
			if(action && this.actions[(action)]) {
				this.actions[(action)]()
				return
			}
		}

		def result = helperService.runShellCommand(command.split(' '))

		if(sleep) {
			Thread.sleep(1000);
		}
		return result
	}
	
	def deleteDelayFile(def name)
	{
		def filePath = toString("${delayFilesPath}${name}.json")
		def dh = new File(filePath)
		if(dh && dh.isFile() && dh.exists()) {
			dh.delete()
		}
	}
	
	def saveDelayFile(def item, def delay)
	{
		if(!delay) {
			return;
		}
	
		// lets stick with Unix time
		def delayInfoObject = [
			delay: delay,
			time: (new Date()).getTime() / 1000L
		]

		def jsonObj = new JsonObject(delayInfoObject)
		def fileName = "${item.getProp('name')}.json"
		helperService.writeFile(delayFilesPath, fileName, jsonObj.toString())
		item.delayData = jsonObj
	}

	void localLogger(def message, def onlyDev = false) {
		logger.info(toString((message).toString() << '\n'))
	}
}