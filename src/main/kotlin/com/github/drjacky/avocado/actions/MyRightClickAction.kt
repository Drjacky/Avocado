import com.github.drjacky.avocado.MyProjectComponent
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.actionSystem.CommonDataKeys
import com.intellij.openapi.components.ServiceManager
import com.intellij.openapi.vfs.VirtualFile
import com.intellij.psi.PsiFile
import com.intellij.psi.xml.XmlFile
import java.io.BufferedReader
import java.io.File
import java.io.InputStreamReader

class MyRightClickAction : AnAction() {

    override fun actionPerformed(e: AnActionEvent) {
        val psiFile = e.getData(CommonDataKeys.PSI_FILE)
        if (psiFile != null) {
            if (isXmlFileInDrawableFolder(psiFile)) {
                // Run the Node.js script through Avocado
                runNodeScript("/Users/drjacky/Projectz/Avocado/src/main/resources/avocado", psiFile.virtualFile)
                /*val project = e.project
                val projectComponent = project?.let { ServiceManager.getService(it, MyProjectComponent::class.java) }
                val avocadoScriptPath = projectComponent?.avocadoScriptPath
                if (avocadoScriptPath != null) {
                    runNodeScript(avocadoScriptPath, psiFile.virtualFile)
                }*/
            } else {
                // Handle the case where the file is not in the expected folder
                println("Right-clicked on XML file, but not in the expected folder")
            }
        } else {
            // Handle the case where the PSI file is null
            println("Right-clicked, but PSI file is null")
        }
    }

    override fun update(e: AnActionEvent) {
        // Enable or disable the action based on your criteria
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

            // Set the working directory (optional)
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

            // Handle the output as needed

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
        // You can add platform-specific installation instructions here
        println("Node.js is not installed. Please install Node.js.")
    }
}