import com.intellij.openapi.actionSystem.ActionUpdateThread
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.actionSystem.CommonDataKeys
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.progress.ProgressIndicator
import com.intellij.openapi.progress.ProgressManager
import com.intellij.openapi.progress.Task
import com.intellij.openapi.progress.impl.BackgroundableProcessIndicator
import com.intellij.openapi.project.Project
import com.intellij.openapi.vcs.changes.VcsDirtyScopeManager
import com.intellij.openapi.vfs.VfsUtil
import com.intellij.openapi.vfs.VirtualFile
import com.intellij.vcsUtil.VcsFileUtil
import com.intellij.vcsUtil.VcsUtil
import java.io.*
import java.net.URL
import javax.swing.SwingUtilities
import kotlin.io.path.createTempFile

class AvocadoSizeItRightClickAction : AnAction() {

    override fun actionPerformed(e: AnActionEvent) {
        val project: Project? = e.project
        if (project != null) {
            val os = System.getProperty("os.name").lowercase()
            val executableName = when {
                os.contains("mac") -> "avocado-macos"
                os.contains("win") -> "avocado-win.exe"
                os.contains("linux") -> "avocado-linux"
                else -> {
                    println("Unsupported operating system: $os")
                    return
                }
            }
            val avocadoScriptPath = this::class.java.classLoader.getResource(executableName)

            if (avocadoScriptPath != null) {
                val files = e.getData(CommonDataKeys.VIRTUAL_FILE_ARRAY)

                if (!files.isNullOrEmpty()) {
                    if (isXmlFileInDrawableFolder(files)) {
                        processFilesWithAvocado(project, avocadoScriptPath, executableName, files)
                    } else if (isDrawableFolder(files)) {
                        val folder = files[0]
                        val filePaths = mutableListOf<VirtualFile>()

                        folder.children.forEach { child ->
                            filePaths.add(child)
                        }
                        processFilesWithAvocado(project, avocadoScriptPath, executableName, filePaths.toTypedArray())
                    } else {
                        println("Right-clicked on file, but not in the expected folder or not xml")
                    }
                } else {
                    println("Right-clicked, but files are null/empty")
                }
            } else {
                println("avocadoScriptPath is blank!")
            }
        } else {
            println("Project path is null!")
        }
    }

    private fun processFilesWithAvocado(
        project: Project,
        avocadoScriptPath: URL,
        executableName: String,
        files: Array<VirtualFile>
    ) {
        val task = object : Task.Backgroundable(project, "Avocado-Size It", true) {
            override fun run(indicator: ProgressIndicator) {
                val executableFile = createTempExecutableFile(avocadoScriptPath, executableName)
                if (executableFile.exists()) {
                    val processedFiles = files.mapNotNull { file ->
                        file.takeIf {
                            avocadoSizeIt(executableFile.absolutePath, file)
                        }
                    }
                    refreshFiles(processedFiles, project)
                } else {
                    println("Avocado executable not found: ${executableFile.absolutePath}")
                }
            }
        }
        ProgressManager.getInstance()
            .runProcessWithProgressAsynchronously(task, BackgroundableProcessIndicator(task))
    }

    private fun createTempExecutableFile(avocadoScriptPath: URL, executableName: String): File {
        val executableFile: File = if (avocadoScriptPath.protocol == "jar") {
            val tempFile = createTempFile(executableName).toFile()

            tempFile.deleteOnExit()

            // Copy the executable from the JAR to the temporary file
            avocadoScriptPath.openStream().use { input ->
                FileOutputStream(tempFile).use { output ->
                    input.copyTo(output)
                }
            }

            // Set execute permission on the temporary file
            tempFile.setExecutable(true)

            tempFile
        } else {
            File(avocadoScriptPath.toURI())
        }

        return executableFile
    }

    private fun isXmlFileInDrawableFolder(virtualFiles: Array<VirtualFile>?): Boolean {
        return virtualFiles?.all { virtualFile ->
            val parentFolder = virtualFile.parent
            virtualFile.extension == "xml" &&
                    (parentFolder?.name == "drawable" || parentFolder?.name?.startsWith("drawable-") == true) &&
                    parentFolder.parent?.name == "res"
        } ?: false
    }

    private fun isDrawableFolder(virtualFiles: Array<VirtualFile>?): Boolean {
        return virtualFiles?.all { virtualFile ->
            val parentFolder = virtualFile.parent
            virtualFile.isDirectory && (virtualFile.name == "drawable" || virtualFile.name.startsWith("drawable-")) && parentFolder?.name == "res"
        } ?: false
    }

    private fun avocadoSizeIt(executableFilePath: String, file: VirtualFile): Boolean {
        val fullPath = file.path
        try {
            val additionalParams = listOf("-i", fullPath)
            val command = mutableListOf(executableFilePath)
            command.addAll(additionalParams)

            val processBuilder = ProcessBuilder(command)

            // Redirect error stream to output stream
            processBuilder.redirectErrorStream(true)

            // Start the process
            val process = processBuilder.start()
            val inputStream = process.inputStream
            val reader = BufferedReader(InputStreamReader(inputStream))
            var line: String?
            while (reader.readLine().also { line = it } != null) {
                println(line)
            }

            val exitCode = process.waitFor()
            println("Exit Code: $exitCode")

            reader.close()

            return true
        } catch (e: IOException) {
            e.printStackTrace()
        } catch (e: InterruptedException) {
            e.printStackTrace()
        }

        return false
    }

    private fun refreshFiles(files: List<VirtualFile>, project: Project) {
        val task = object : Task.Backgroundable(project, "Refresh file(s)", false) {
            override fun run(indicator: ProgressIndicator) {
                ApplicationManager.getApplication().invokeAndWait {
                    VfsUtil.markDirtyAndRefresh(true, false, true, *files.toTypedArray())

                    val dirtyScopeManager = VcsDirtyScopeManager.getInstance(project)
                    val filePaths = files.map { VcsUtil.getFilePath(it) }
                    dirtyScopeManager.filePathsDirty(filePaths, null)
                }
            }
        }
        ProgressManager.getInstance().run(task)
    }

    override fun getActionUpdateThread() = ActionUpdateThread.EDT

    override fun update(e: AnActionEvent) {
        super.update(e)
        SwingUtilities.invokeLater {
            val files = e.getData(CommonDataKeys.VIRTUAL_FILE_ARRAY)
            e.presentation.isEnabledAndVisible =
                files != null && isXmlFileInDrawableFolder(files) || isDrawableFolder(files)
        }
    }
}