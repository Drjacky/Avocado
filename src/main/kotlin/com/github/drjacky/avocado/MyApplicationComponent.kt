package com.github.drjacky.avocado

import com.github.drjacky.avocado.log.SentryIntegration
import com.intellij.openapi.components.ApplicationComponent
import org.jetbrains.annotations.NotNull

class MyApplicationComponent : ApplicationComponent {

    override fun initComponent() {
        SentryIntegration.initSentry()
    }

    override fun disposeComponent() {
    }

    @NotNull
    override fun getComponentName(): String {
        return super.getComponentName()
    }
}