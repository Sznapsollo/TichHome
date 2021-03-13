package com.ak.services

import io.vertx.core.logging.Logger
import io.vertx.core.json.JsonObject

class ItemCheckerService {
    Logger logger = io.vertx.core.logging.LoggerFactory.getLogger('MyMainGroovyVerticle')

    private def nodes
    private def filePath
    private def delayFilesPath
    private def regularactionFilesPath

    def static StandardRadioSignal = 0;
	def static ConradRadioSignal = 1;
	def static WebAddressSignal = 2;
	def static MacAddressSignal = 3;
	def static ShellSignal = 4;
	def static GroupItem = 5;

    class BaseItem
    {
        public def properties;
        public def delayData
        public def regularActionsData
        public def processingStatus
        public def processingSource
        public def regularActionStatus
        public def regularActionDayOffPerformed
        public def regularActionRandomStart
        public def regularActionRandomEnd
        
        public def getProp(def name) {
            if(name == 'enabled') {
                if(this.properties[(name)] == null) {
                    this.properties[(name)] = true;
                }
            }
        
            if(this.properties[(name)] != null)
                return this.properties[(name)];
            else 
                return null;
        }
    }

    class IntItem extends BaseItem
    {
        IntItem() {
        }

        IntItem(def properties) {
            this.properties = properties;
        }
        
        public def CodeOn()
        {
            return this.getProp('codeOn')[0];
        }
        
        public def CodeOff()
        {
            return this.getProp('codeOff');
        }
    }

    class GroupItem extends BaseItem
    {
        GroupItem() {
        }
        GroupItem(def properties) {
            this.properties = properties;
        }
    }

    class WebItem extends IntItem
    {
        WebItem() {
        }
        WebItem(def properties) {
            this.properties = properties;
        }
        
        public def UrlWithCode(def code)
        {
            return (("${this.getProp('address')}?check=1&${code}").toString());
        }
        
        public def UrlWithCheck()
        {
            return (("${this.getProp('address')}?check=1").toString());
        }
        
        public def CodeOn()
        {
            return this.UrlWithCode(this.getProp('codeOn')[0])
        }
        
        public def CodeOff()
        {
            return this.UrlWithCode(this.getProp('codeOff'))
        }
    }

    class MacItem extends BaseItem
    {
        MacItem() {

        }
        MacItem(def properties) {
            this.properties = properties;
        }
        
        public def CodeOn()
        {
            return this.getProp('codeOn')[0]
        }
    }


    class ShellItem extends IntItem
    {
        ShellItem() {

        }
        ShellItem(def properties) {
            this.properties = properties;
        }

    }

    ItemCheckerService() {}
    ItemCheckerService(def settingsService) {
        this.filePath = settingsService.nodesFilePath
        this.delayFilesPath = settingsService.delayFilesPath
        this.regularactionFilesPath = settingsService.regularactionFilesPath

        this.loadItemNodes()
    }

    def isDelayStillValid(def delayData) {
        try {
            def mapData = delayData?.mapTo(Map.class)
            if(!mapData) {
                return false
            }
            def currTime = (new Date()).getTime() / 1000L

            if((mapData?.time + mapData?.delay) > currTime) {
                return true
            }
        } catch(Exception e) {
            localLogger "!!! isDelayStillValid Exception ${e}"
        }
        return false
    }

    def loadItemNodes() {
        def jsonObj
        File nodesFile = new File(this.filePath)
        if (nodesFile.exists()) {
            String fileContent = nodesFile.text
            jsonObj = (new JsonObject(fileContent)).mapTo(Map.class);
        } else {
            localLogger "config file for nodes ${filePath} does not exist !!!"
        }

        this.nodes = [];
	
		jsonObj?.nodes?.each { node ->
            def item
			if(node.sendOption != null && (node.sendOption == StandardRadioSignal || node.sendOption == ConradRadioSignal)) {
				item = new IntItem(node)
            } else if(node.sendOption != null && (node.sendOption == WebAddressSignal)) {
                item = new WebItem(node)
            } else if(node.sendOption != null && (node.sendOption == MacAddressSignal)) {
                item = new MacItem(node) 
            } else if(node.sendOption != null && (node.sendOption == ShellSignal)) {
                item = new ShellItem(node)
            } else if((node.sendOption != null && (node.sendOption == GroupItem)) || ((node.itemIDs))) {
                item = new GroupItem(node)
            }

            if(this.delayFilesPath) {
                def fileName = "${item.getProp('name')}.json"
                def filePath = (("${this.delayFilesPath}${fileName}").toString())
                try {
                    def dh = new File(filePath)
                    if(dh && dh.isFile() && dh.text) {
                        def jsonData = new JsonObject(dh.text)
                        
                        item.delayData = jsonData
                        // else is some old stuff
                    }
                } catch(Exception e) {
                    localLogger "Exception while trying to load delay data for ${fileName}"
                }
            }

            if(this.regularactionFilesPath) {
                def fileName = "${item.getProp('name')}_regular_action.json"
                def filePath = (("${this.regularactionFilesPath}${fileName}").toString())
                try {
                    def dh = new File(filePath)
                    if(dh && dh.isFile() && dh.text) {
                        item.regularActionsData = new JsonObject(dh.text)
                    }
                } catch(Exception e) {
                    localLogger "Exception while trying to load regular data for ${fileName}"
                }
            }

            if(item) {
                this.nodes << item
            }
		}
    }
	
	def getItems(def category) {
        def resultNodes = []	
		this.nodes?.each { item ->
            if(category) {
                if(item.getProp('category') == category) {
                    resultNodes = resultNodes + item;
                }
            }
            else {
                resultNodes = resultNodes + item;
            }
        } 
		
		
		return resultNodes;
	}
	
	public def checkItem(def id) {
        def foundItem = this.nodes?.find { it.getProp('name') == id }
        return foundItem ?: null
	}
	
	public def getItemHeaders(def ids) {
		def itemHeaders = [];
        this.nodes.each { node ->
            if(ids.find {it == node.getProp('name')}) {
                itemHeaders = itemHeaders + node.getProp('header')
            }
        }
		return itemHeaders;
	}


	void localLogger(def message, def onlyDev = false) {
		logger.info((((message).toString()) << '\n').toString())
	}


}