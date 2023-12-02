import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.actionSystem.CommonDataKeys
import com.intellij.openapi.module.ModuleManager
import com.intellij.openapi.project.Project
import com.intellij.openapi.roots.ModuleRootManager
import com.intellij.openapi.vfs.VirtualFile
import com.intellij.psi.PsiFile
import com.intellij.psi.xml.XmlFile
import java.io.BufferedReader
import java.io.File
import java.io.IOException
import java.io.InputStreamReader

class AvocadoSizeItRightClickAction : AnAction() {

    override fun actionPerformed(e: AnActionEvent) {
        val projectObject: Project? = e.project
        if (projectObject != null) {
            val isDevelopmentMode = System.getProperty("idea.is.internal") == "true"
            val avocadoScriptPath =
                if (isDevelopmentMode) {
                    "/Users/drjacky/Projectz/Avocado/src/main/resources/avocado"
                } else {
                    this.javaClass.getResource("avocado")?.toString()
                }

            if (avocadoScriptPath != null) {
                val psiFile = e.getData(CommonDataKeys.PSI_FILE)

                if (psiFile != null) {
                    if (isXmlFileInDrawableFolder(psiFile)) {
                        runNodeScript(avocadoScriptPath, psiFile.virtualFile)
                    } else {
                        println("Right-clicked on XML file, but not in the expected folder")
                    }
                } else {
                    println("Right-clicked, but PSI file is null")
                }
            } else {
                println("avocadoScriptPath is blank!")
            }
        } else {
            println("Project path is null!")
        }
    }

    override fun update(e: AnActionEvent) {
        val psiFile = e.getData(CommonDataKeys.PSI_FILE)
        e.presentation.isEnabledAndVisible = isXmlFileInDrawableFolder(psiFile)
    }

    private fun isXmlFileInDrawableFolder(psiFile: PsiFile?): Boolean {
        val parentFolder = psiFile?.virtualFile?.parent
        return psiFile is XmlFile &&
                psiFile.virtualFile?.extension == "xml" &&
                (parentFolder?.name == "drawable" || parentFolder?.name?.startsWith("drawable-") == true) &&
                parentFolder.parent?.name == "res"
    }

    private fun runNodeScript(avocadoScriptPath: String, file: VirtualFile) {
        // Check and install Node.js if needed
        if (!isNodeInstalled()) {
            installNode()
            return
        }

        // Continue with the script execution
        val fullPath = file.path
        try {
            // Build the command to execute
            val command = arrayOf("node", avocadoScriptPath, fullPath)

            val workingDirectory = file.parent?.path
            val processBuilder = ProcessBuilder(*command)
            if (workingDirectory != null) {
                processBuilder.directory(File(workingDirectory))
            }

            // Start the process
            val process = processBuilder.start()

            // Capture and print the error stream
            val errorReader = BufferedReader(InputStreamReader(process.errorStream))
            var errorLine: String?
            while (errorReader.readLine().also { errorLine = it } != null) {
                println("Avocado Error: $errorLine")
            }

            // Wait for the process to complete
            val exitCode = process.waitFor()
            println("Script executed with exit code: $exitCode")
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun isNodeInstalled(): Boolean {
        val processBuilder = ProcessBuilder("node", "--version")
        return try {
            val process = processBuilder.start()
            process.waitFor() == 0
        } catch (e: Exception) {
            false
        }
    }

    private fun installNode() {
        val os = System.getProperty("os.name").toLowerCase()

        val command = when {
            os.contains("mac") || os.contains("macos") -> "brew install node"
            os.contains("win") -> "choco install nodejs"
            os.contains("linux") || os.contains("nix") || os.contains("nux") -> "apt-get install -y nodejs"
            else -> {
                println("Unsupported operating system: $os")
                return
            }
        }

        try {
            val process = Runtime.getRuntime().exec(command)
            val exitCode = process.waitFor()

            if (exitCode == 0) {
                println("Node.js installed successfully.")
            } else {
                println("Failed to install Node.js. Exit code: $exitCode")
            }
        } catch (e: IOException) {
            e.printStackTrace()
        } catch (e: InterruptedException) {
            e.printStackTrace()
        }
    }
}