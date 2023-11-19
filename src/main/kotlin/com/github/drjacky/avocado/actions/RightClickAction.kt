import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.actionSystem.CommonDataKeys
import com.intellij.openapi.ui.Messages
import com.intellij.openapi.vfs.VirtualFile
import java.io.BufferedReader
import java.io.File
import java.io.InputStreamReader

class RightClickAction : AnAction() {
    private val NODE_EXECUTABLE = "node"
    private val AVOCADO_EXECUTABLE_PATH = "avocado" // Relative path to resources folder

    override fun actionPerformed(event: AnActionEvent) {
        // Check and install Node.js if needed
        if (!isNodeInstalled()) {
            installNode()
            return
        }

        // Continue with the script execution
        val selectedFile = event.getData(CommonDataKeys.VIRTUAL_FILE)
        if (selectedFile != null) {
            val fullPath = selectedFile.path
            if (isXmlFileInDrawableFolder(selectedFile)) {
                try {
                    // Build the command to execute
                    val command = arrayOf(NODE_EXECUTABLE, AVOCADO_EXECUTABLE_PATH, fullPath)

                    // Set the working directory (optional)
                    val workingDirectory = selectedFile.parent?.path
                    val processBuilder = ProcessBuilder(*command)
                    if (workingDirectory != null) {
                        processBuilder.directory(File(workingDirectory))
                    }

                    // Start the process
                    val process = processBuilder.start()

                    // Read the output (if any)
                    val reader = BufferedReader(InputStreamReader(process.inputStream))
                    var line: String?
                    val outputStringBuilder = StringBuilder()
                    while (reader.readLine().also { line = it } != null) {
                        println(line)
                        outputStringBuilder.append(line).append("\n")
                    }

                    // Wait for the process to complete
                    val exitCode = process.waitFor()
                    println("Script executed with exit code: $exitCode")

                    // Handle the output as needed

                } catch (e: Exception) {
                    e.printStackTrace()
                }
            } else {
                // Handle the case where selectedFile is not in the expected folder
                Messages.showErrorDialog("Selected file is not in the expected folder.", "Error")
            }
        } else {
            // Handle the case where selectedFile is null
            Messages.showErrorDialog("Selected file is null.", "Error")
        }
    }

    private fun isNodeInstalled(): Boolean {
        val processBuilder = ProcessBuilder(NODE_EXECUTABLE, "--version")
        return try {
            val process = processBuilder.start()
            process.waitFor()
            true
        } catch (e: Exception) {
            false
        }
    }

    private fun installNode() {
        // You can add platform-specific installation instructions here
        Messages.showMessageDialog(
            "Node.js is not installed. Please install Node.js.",
            "Node.js Not Found",
            Messages.getErrorIcon()
        )
    }

    private fun isXmlFileInDrawableFolder(file: VirtualFile): Boolean {
        return file.extension == "xml" && "drawable" == file.parent?.name
    }

    override fun update(event: AnActionEvent) {
        val file = event.getData(CommonDataKeys.VIRTUAL_FILE)
        event.presentation.isEnabledAndVisible = file != null && isXmlFileInDrawableFolder(file)
    }
}