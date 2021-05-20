package com.github.drjacky.avocado.services

import com.github.drjacky.avocado.MyBundle
import com.intellij.openapi.project.Project

class MyProjectService(project: Project) {

    init {
        println(MyBundle.message("projectService", project.name))
    }
}
