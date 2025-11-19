import React, { useState, useRef } from "react";
import { useAppContext } from "../context/AppContext";
import { Card, Button, Input } from "./UI";
import { NotificationTrigger, LocalizedTemplate } from "../types";

// Define available variables for each trigger to assist the user
const TRIGGER_VARIABLES: Record<NotificationTrigger, string[]> = {
  [NotificationTrigger.NEW_INVOICE]: ["{vendor}", "{total}", "{userName}"],
  [NotificationTrigger.EXPENSE_APPROVED]: ["{vendor}", "{total}"],
  [NotificationTrigger.EXPENSE_REJECTED]: ["{vendor}", "{total}"],
  [NotificationTrigger.BUDGET_THRESHOLD]: [
    "{responsibilityName}",
    "{usagePercentage}",
  ],
  [NotificationTrigger.RESPONSIBILITY_ASSIGNED]: [
    "{responsibilityName}",
    "{budget}",
  ],
};

const TRIGGER_ICONS: Record<NotificationTrigger, React.ReactNode> = {
  [NotificationTrigger.NEW_INVOICE]: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  ),
  [NotificationTrigger.EXPENSE_APPROVED]: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  [NotificationTrigger.EXPENSE_REJECTED]: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  [NotificationTrigger.BUDGET_THRESHOLD]: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  ),
  [NotificationTrigger.RESPONSIBILITY_ASSIGNED]: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  ),
};

type ViewMode = "smtp" | NotificationTrigger;

const Notifications: React.FC = () => {
  const {
    notificationSettings,
    saveNotificationSettings,
    sendNotification,
    t,
  } = useAppContext();
  const [settings, setSettings] = useState(notificationSettings);
  const [activeTab, setActiveTab] = useState<"en" | "ar">("en");
  const [selectedView, setSelectedView] = useState<ViewMode>("smtp");
  const [showPreview, setShowPreview] = useState(true);

  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const handleSmtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      smtp: { ...prev.smtp, [name]: name === "port" ? parseInt(value) : value },
    }));
  };

  const handleTemplateChange = (
    trigger: NotificationTrigger,
    field: keyof LocalizedTemplate,
    value: string
  ) => {
    setSettings((prev) => ({
      ...prev,
      templates: {
        ...prev.templates,
        [trigger]: {
          ...prev.templates[trigger],
          [activeTab]: {
            ...prev.templates[trigger][activeTab],
            [field]: value,
          },
        },
      },
    }));
  };

  const saveSettings = () => {
    saveNotificationSettings(settings);
  };

  const sendTestEmail = () => {
    sendNotification(NotificationTrigger.NEW_INVOICE, {
      vendor: "Test Vendor",
      total: 123.45,
      userName: "Test User",
      _toastMessage: "Test email sent successfully!",
    });
  };

  const injectVariable = (variable: string) => {
    if (selectedView === "smtp") return;
    const trigger = selectedView as NotificationTrigger;
    const currentBody = settings.templates[trigger][activeTab].body;

    // Simple append for better UX without complex cursor management in this context
    // Or if ref is available, insert at cursor
    if (textAreaRef.current) {
      const start = textAreaRef.current.selectionStart;
      const end = textAreaRef.current.selectionEnd;
      const text = currentBody;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      const newText = before + variable + after;
      handleTemplateChange(trigger, "body", newText);

      // Reset focus (setTimeout to allow render)
      setTimeout(() => {
        if (textAreaRef.current) {
          textAreaRef.current.focus();
          textAreaRef.current.selectionStart = start + variable.length;
          textAreaRef.current.selectionEnd = start + variable.length;
        }
      }, 0);
    } else {
      handleTemplateChange(trigger, "body", currentBody + " " + variable);
    }
  };

  const renderPreview = (trigger: NotificationTrigger) => {
    let body = settings.templates[trigger][activeTab].body;
    let subject = settings.templates[trigger][activeTab].subject;

    // Mock data for preview
    const mocks: Record<string, string> = {
      "{vendor}": "Acme Corp",
      "{total}": "1,250.00",
      "{userName}": "John Doe",
      "{responsibilityName}": "Q3 Marketing Budget",
      "{usagePercentage}": "85",
      "{budget}": "5,000.00",
    };

    let previewBody = body;
    let previewSubject = subject;
    Object.keys(mocks).forEach((key) => {
      const regex = new RegExp(key, "g");
      previewBody = previewBody.replace(regex, mocks[key]);
      previewSubject = previewSubject.replace(regex, mocks[key]);
    });

    const isRtl = activeTab === "ar";

    return (
      <div className="mt-6 animate-fadeIn">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
          Live Preview
        </h4>
        <div className="border rounded-lg overflow-hidden shadow-sm bg-white">
          <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
            <div className="text-sm text-gray-700">
              <span className="font-semibold text-gray-500">Subject:</span>{" "}
              <span className={isRtl ? "font-arabic" : ""}>
                {previewSubject}
              </span>
            </div>
            <div className="flex space-x-1">
              <div className="w-2 h-2 rounded-full bg-red-400"></div>
              <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
            </div>
          </div>
          <div
            className={`p-6 text-gray-800 text-sm leading-relaxed whitespace-pre-wrap ${
              isRtl ? "text-right font-arabic" : "text-left"
            }`}
            dangerouslySetInnerHTML={{
              __html: previewBody.replace(/\n/g, "<br/>"),
            }}
          ></div>
          <div className="bg-gray-50 px-4 py-2 border-t text-xs text-gray-400 text-center">
            This is a simulation. Actual email appearance depends on the client.
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text-main">
          {t("notifications.title")}
        </h1>
        <div className="flex space-x-3">
          <Button
            onClick={sendTestEmail}
            className="!bg-gray-600 hover:!bg-gray-700 text-sm px-4"
          >
            {t("notifications.sendTest")}
          </Button>
          <Button onClick={saveSettings} className="text-sm px-6">
            {t("notifications.save")}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden rounded-xl shadow-lg border border-gray-200 bg-white">
        {/* Sidebar */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Configuration
            </h3>
          </div>
          <button
            onClick={() => setSelectedView("smtp")}
            className={`w-full flex items-center px-4 py-3 text-sm font-medium transition-colors ${
              selectedView === "smtp"
                ? "bg-white text-primary border-r-2 border-primary"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <svg
              className="w-5 h-5 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.096 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            SMTP Settings
          </button>

          <div className="p-4 border-b border-gray-200 mt-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Notification Triggers
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {Object.keys(settings.templates).map((key) => {
              const trigger = key as NotificationTrigger;
              return (
                <button
                  key={trigger}
                  onClick={() => setSelectedView(trigger)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium text-left transition-colors border-b border-gray-100 ${
                    selectedView === trigger
                      ? "bg-white text-primary border-r-2 border-primary"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <span className="mr-3 opacity-70">
                    {TRIGGER_ICONS[trigger]}
                  </span>
                  <span className="truncate">{trigger}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-white">
          {selectedView === "smtp" ? (
            <div className="p-8 max-w-3xl">
              <div className="flex items-center mb-6 pb-4 border-b">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600 mr-4">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {t("notifications.smtpConfig")}
                  </h2>
                  <p className="text-gray-500 text-sm">
                    Configure the outgoing mail server details.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    {t("notifications.smtpServer")}
                  </label>
                  <Input
                    name="server"
                    value={settings.smtp.server}
                    onChange={handleSmtpChange}
                    className="!py-2.5"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    {t("notifications.port")}
                  </label>
                  <Input
                    name="port"
                    type="number"
                    value={settings.smtp.port}
                    onChange={handleSmtpChange}
                    className="!py-2.5"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    {t("notifications.username")}
                  </label>
                  <Input
                    name="user"
                    value={settings.smtp.user}
                    onChange={handleSmtpChange}
                    className="!py-2.5"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    {t("notifications.password")}
                  </label>
                  <Input
                    name="pass"
                    type="password"
                    value={settings.smtp.pass}
                    onChange={handleSmtpChange}
                    className="!py-2.5"
                  />
                </div>
              </div>
              <div className="mt-8 p-4 bg-yellow-50 border border-yellow-100 rounded-md flex items-start">
                <svg
                  className="w-5 h-5 text-yellow-600 mr-2 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-yellow-800">
                  Ensure your SMTP provider allows connections from this IP
                  address. For Gmail, you may need to use an App Password.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex h-full">
              <div className="flex-1 p-8 overflow-y-auto">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                      {selectedView}
                    </h2>
                    <p className="text-sm text-gray-500">
                      Customize the email content sent for this trigger.
                    </p>
                  </div>
                  <div className="bg-gray-100 p-1 rounded-lg inline-flex">
                    <button
                      onClick={() => setActiveTab("en")}
                      className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                        activeTab === "en"
                          ? "bg-white shadow-sm text-primary"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => setActiveTab("ar")}
                      className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                        activeTab === "ar"
                          ? "bg-white shadow-sm text-primary"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      العربية
                    </button>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      {t("notifications.subject")}
                    </label>
                    <Input
                      value={
                        settings.templates[selectedView as NotificationTrigger][
                          activeTab
                        ]?.subject || ""
                      }
                      onChange={(e) =>
                        handleTemplateChange(
                          selectedView as NotificationTrigger,
                          "subject",
                          e.target.value
                        )
                      }
                      className={`!py-2.5 ${
                        activeTab === "ar" ? "text-right" : ""
                      }`}
                      dir={activeTab === "ar" ? "rtl" : "ltr"}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="block text-sm font-semibold text-gray-700">
                        Email Body
                      </label>
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-gray-400 mr-1">
                          Variables:
                        </span>
                        {TRIGGER_VARIABLES[
                          selectedView as NotificationTrigger
                        ].map((variable) => (
                          <button
                            key={variable}
                            onClick={() => injectVariable(variable)}
                            type="button"
                            className="inline-flex items-center px-2 py-1 rounded bg-blue-50 text-blue-600 text-xs hover:bg-blue-100 border border-blue-200 transition-colors"
                            title="Click to insert"
                          >
                            {variable}
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      ref={textAreaRef}
                      value={
                        settings.templates[selectedView as NotificationTrigger][
                          activeTab
                        ]?.body || ""
                      }
                      onChange={(e) =>
                        handleTemplateChange(
                          selectedView as NotificationTrigger,
                          "body",
                          e.target.value
                        )
                      }
                      placeholder={t("notifications.bodyPlaceholder")}
                      rows={12}
                      dir={activeTab === "ar" ? "rtl" : "ltr"}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-mono text-sm leading-relaxed resize-none ${
                        activeTab === "ar" ? "text-right" : ""
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Preview Panel */}
              {showPreview && (
                <div className="w-96 bg-gray-50 border-l border-gray-200 p-6 overflow-y-auto hidden xl:block">
                  {renderPreview(selectedView as NotificationTrigger)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
