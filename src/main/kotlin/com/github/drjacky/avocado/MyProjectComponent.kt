package com.github.drjacky.avocado

import com.intellij.openapi.components.ProjectComponent
import com.intellij.openapi.project.Project
import java.io.File

class MyProjectComponent(private val project: Project) : ProjectComponent {

    var avocadoScriptPath: String? = null

    override fun projectOpened() {
        super.projectOpened()
        // Get the plugin path dynamically
        val pluginPath = project.basePath ?: return

        println("pluginPath: $avocadoScriptPath")

        // Construct the dynamic path to the avocado script
        avocadoScriptPath = File(pluginPath, "src/main/resources/avocado").absolutePath

        // Now you can use avocadoScriptPath as the dynamic path
        println("Avocado Script Path: $avocadoScriptPath")
    }
}