package com.github.drjacky.avocado.log

import com.intellij.openapi.application.ex.ApplicationInfoEx
import io.sentry.Sentry
import io.sentry.SentryLevel

object SentryIntegration {

    fun initSentry() {
//        synchronized(SentryIntegration.javaClass) {
            val pluginVersion = System.getProperty("pluginVersion")

            Sentry.init { options ->
                options.dsn =
                    "https://f72444f4b2395b4da3731fba282f7898@o4507282921816064.ingest.de.sentry.io/4507282932498512"
                options.environment = "production"
                options.tracesSampleRate = 1.0
                options.release = pluginVersion
                options.isDebug = true
                options.shutdownTimeoutMillis = 5000
                options.setDiagnosticLevel(SentryLevel.ERROR)
                options.setTag("ide", ApplicationInfoEx.getInstance().fullApplicationName);
            }
//        }
    }
}