package com.github.drjacky.avocado.actions

import com.github.drjacky.avocado.utils.StringsBundle
import com.github.drjacky.avocado.utils.Utils
import com.intellij.notification.NotificationType
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent

class MyAction: AnAction() {

    override fun actionPerformed(e: AnActionEvent) {
        Utils.createNotification(
            StringsBundle.message("action.title"),
            StringsBundle.message("action.message"),
            e.project,
            NotificationType.INFORMATION,
            null
        )
    }
}