package com.ak.services

import io.vertx.core.logging.Logger
import io.vertx.core.json.JsonObject
import java.io.StringWriter
import java.io.PrintWriter

class HelperService {
    Logger logger = io.vertx.core.logging.LoggerFactory.getLogger('MyMainGroovyVerticle')

	def generateRandomKey() {
        return generateKey( (('A'..'Z')+('0'..'9')).join(), 9 )
    }

    def generateKey(String alphabet, int n) {
        new Random().with {
            (1..n).collect { alphabet[ nextInt( alphabet.length() ) ] }.join()
        }
    }

	public def fileExists(filePath) {
		try {
			File entity = new File(filePath);
			if (entity.exists()){
				return true
			}
		} catch(Exception e) {
			localLogger "!!! fileExists exception"
			localLogger e
		}
		return false
	}

	public void writeFile(def folderPath, def fileName, def fileContent){
		File directory = new File(folderPath);
		if (! directory.exists()){
			directory.mkdirs();
			// If you require it to make the entire directory path including parents,
			// use directory.mkdirs(); here instead.
			localLogger "Directory ${folderPath} did not exist - created"
		}

		File file = new File(folderPath + fileName);
		try{
			FileWriter fw = new FileWriter(file.getAbsoluteFile());
			BufferedWriter bw = new BufferedWriter(fw);
			bw.write(fileContent);
			bw.close();
		}
		catch (IOException e){
			localLogger "Error on writeFile for file ${fileName}"
			e.printStackTrace();
		}
	}

	public void appendFile(def folderPath, def fileName, def fileContent){
		File directory = new File(folderPath);
		if (! directory.exists()){
			directory.mkdirs();
			// If you require it to make the entire directory path including parents,
			// use directory.mkdirs(); here instead.
			localLogger "Directory ${folderPath} did not exist - created"
		}

		File file = new File(folderPath + fileName);
		try{
			file.append('\r\n')
			file.append(toString(fileContent))
		}
		catch (IOException e){
			localLogger "Error on appendFile for file ${fileName}"
			e.printStackTrace();
		}
	}

	public def toBoolean(value) {
		if (value && value.toLowerCase() != "false") {
			return true;
		} else {
			return false;
		}
	}

	def getWebPageContent(def args = [:]) {
		try {
			return getWebPageContentWithCurl(args)
		} catch(Exception e) {
			localLogger "!!! getWebPageContent exception"
			localLogger e	
		}
		return ''
	}

	// curl -X POST -d '{"type":"toggle","outletId":"Test 62 web item","outletStatus":"off","outletDelayed":60,"outletSource":"Web"}' --max-time 1 -sB -H "Accept: application/json" http://localhost:8081/wylaczniki/actions

	def getWebPageContentWithCurl(def args = [:]) {
		def url = args.url
		def data = args.data
		def method = args.method ?: 'GET'
		// def command = [
		// 	"curl",
		// 	"-X",
		// 	"GET",
		// 	(url.toString())
		// ]
		def command = ['curl']

		if(data) {
			if(method == 'GET') {
				command << '-X'
				command << 'GET'
			} else if (method == 'POST') {
				command << '-X'
				command << 'POST'
				command << '-d'
				command << toString("${data.toString()}")
			}
		}

		command = command + [
			"--max-time",
			"1",
			"-sB",
			"-H",
			'"Content-type: application/json"',
			"-H",
			'"Accept: application/json"',
			(url.toString())
		]

		return runShellCommand(command)	
	}

	def runShellCommandNoWait(def command) {
		def pb = new ProcessBuilder(command)
        localLogger "runShellCommandNoWait - executing: ${command.join(' ')}"
        pb.redirectErrorStream(true)
        
        Process process = pb.start()
	}
	def runShellCommand(def command) {
		try {
			def pb = new ProcessBuilder(command)
			localLogger "runShellCommand - executing: ${command.join(' ')}"
			pb.redirectErrorStream(true)
			
			Process process = pb.start()
			// process.inputStream.eachLine {
			//     localLogger "executeCommand - log - $it"
			// }

			BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
			StringBuilder builder = new StringBuilder();
			String line = null;
			while ( (line = reader.readLine()) != null) {
			builder.append(line);
			builder.append(System.getProperty("line.separator"));
			}
			String result = builder.toString();

			// localLogger result

			process.waitFor()
			// process.waitFor(10, TimeUnit.SECONDS)

			if(process.exitValue() == 0 && result) {
				return result
			} else {
				return ''
			}
		}
		catch(Exception e) {
			localLogger "runShellCommand exception"
			localLogger e.toString()
			localLogger e.printStackTrace()
			return ''
		}
	}

	String getWebPageContentWithURL(def args = [:]) {
		def url = args.url
		localLogger 'getWebPageContent'
		localLogger url
        def result
        def post = new URL(url.toString()).openConnection()
        post.setConnectTimeout(2 * 1000)
        post.setRequestMethod("GET")
        post.setRequestProperty('Accept', 'application/json')
        def postRC = post.getResponseCode()

        if (postRC.equals(200)) {
            InputStream inputStream
            try {
                inputStream = post.getInputStream()
                result = inputStream.getText()
                // log.info 'Got ipquality reponse tekst: ' << responseDataJsonText
            } finally {
                if (inputStream != null) {
                    try {
                        inputStream.close()   
                    } catch (Throwable t) {
                        log.error((("Error reading from ${url}").toString()), t)
                    }
                }
            }
        } else {
			localLogger "Something went wrong with getWebPageContent for ${url} code was: ${postRC}"
		}
		localLogger 'end'
        return result
    }

	def getExceptionStackTrace(def e) {
		try {
			StringWriter sw = new StringWriter()
			PrintWriter pw = new PrintWriter(sw)
			e.printStackTrace(pw)
			return sw.toString()
		} catch(Throwable t) {
			return null
		}
	}

	static def toString(def value) {
		return ((value ?: '').toString())
	}

	void localLogger(def message, def onlyDev = false) {
		logger.info((((message).toString()) << '\n').toString())
	}
}