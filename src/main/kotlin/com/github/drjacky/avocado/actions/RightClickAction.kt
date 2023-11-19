package com.github.drjacky.avocado.actions

import com.intellij.ide.highlighter.XmlFileType
import com.intellij.json.JsonLanguage
import com.intellij.openapi.actionSystem.ActionPlaces
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.actionSystem.CommonDataKeys
import com.intellij.openapi.vfs.VirtualFile
import com.intellij.psi.PsiFile
import java.io.BufferedReader
import java.io.File
import java.io.InputStreamReader


class RightClickAction : AnAction() {

    /*override fun update(e: AnActionEvent) {
//        if (e.isFromContextMenu) {
        if (ActionPlaces.isPopupPlace(e.place)) {
            val psiFile: PsiFile? = e.getData(CommonDataKeys.PSI_FILE)
            this.templatePresentation.isEnabledAndVisible = (psiFile?.fileType == XmlFileType.INSTANCE)
            this.templatePresentation.isEnabled = false
        }
    }*/

    override fun update(event: AnActionEvent) {
        val file = event.getData(CommonDataKeys.VIRTUAL_FILE)
        event.presentation.isEnabledAndVisible = file != null && isXmlFileInDrawableFolder(file)
    }

    override fun actionPerformed(event: AnActionEvent) {
        val selectedFile = event.getData(CommonDataKeys.VIRTUAL_FILE)
        if (selectedFile != null && isXmlFileInDrawableFolder(selectedFile)) {
            try {
                // Read the content of the XML file
                val xmlContent = String(selectedFile.contentsToByteArray())

                // Specify the path to your script
                val scriptPath = "/usr/bin/env/avocado"

                // Build the command to execute
                val command = arrayOf("node", scriptPath)

                // Set the working directory if needed
                val workingDirectory = selectedFile.parent.path
                val processBuilder = ProcessBuilder(*command)
                processBuilder.directory(File(workingDirectory))

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

                // Write the modified content back to the XML file
                selectedFile.setBinaryContent(outputStringBuilder.toString().toByteArray())

            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }


    private fun isXmlFileInDrawableFolder(file: VirtualFile): Boolean {
        return file.extension == "xml" && file.parent?.name == "drawable"
    }

}