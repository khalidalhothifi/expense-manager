import React, { useState } from "react";
import { Modal, Button } from "./UI";
import { Expense, ExpenseStatus, Attachment } from "../types";
import { formatDateTime } from "../utils/dateUtils";
import { useAppContext } from "../context/AppContext";
import FilePreviewModal from "./FilePreviewModal";

interface ExpenseDetailModalProps {
  expense: Expense;
  onClose: () => void;
}

const ExpenseDetailModal: React.FC<ExpenseDetailModalProps> = ({
  expense,
  onClose,
}) => {
  const { users, t } = useAppContext();
  const [selectedAttachment, setSelectedAttachment] =
    useState<Attachment | null>(null);
  const submitterName =
    users.find((u) => u.id === expense.submittedBy)?.name ||
    t("expenses.unknown");

  const statusColor = {
    [ExpenseStatus.APPROVED]: "bg-green-100 text-green-800",
    [ExpenseStatus.PENDING]: "bg-yellow-100 text-yellow-800",
    [ExpenseStatus.REJECTED]: "bg-red-100 text-red-800",
  }[expense.status];

  const attachments = expense.attachments || [];

  return (
    <>
      <Modal
        isOpen={true}
        onClose={onClose}
        title={t("expenses.detailsTitle") || "Request Details"}
      >
        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {expense.vendor}
              </h3>
              <p className="text-sm text-gray-500">
                {t("expenses.invoiceNumber")}: {expense.invoiceNumber || "N/A"}
              </p>
            </div>
            <div className="text-right">
              <span
                className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${statusColor}`}
              >
                {t(`enums.status.${expense.status}`)}
              </span>
              <p className="text-sm text-gray-500 mt-1">
                {formatDateTime(expense.createdAt || expense.date)}
              </p>
            </div>
          </div>

          {/* Main Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">
                {t("expenses.submittedBy")}
              </label>
              <p className="text-gray-900 font-medium">{submitterName}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">
                {t("expenses.category")}
              </label>
              <p className="text-gray-900">{expense.category}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">
                {t("expenses.date")}
              </label>
              <p className="text-gray-900">{expense.date}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">
                {t("expenses.totalAmount")}
              </label>
              <p className="text-xl font-bold text-primary-dark">
                ${Number(expense.total).toFixed(2)}
              </p>
              <p className="text-xs text-gray-400">
                ({t("expenses.tax")}: ${Number(expense.tax).toFixed(2)})
              </p>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <h4 className="font-semibold mb-2 border-b pb-1">
              {t("expenses.lineItems")}
            </h4>
            <div className="bg-gray-50 rounded-md p-3">
              {expense.lineItems && expense.lineItems.length > 0 ? (
                <ul className="space-y-2">
                  {expense.lineItems.map((item, idx) => (
                    <li key={idx} className="flex justify-between text-sm">
                      <span>
                        {item.description}{" "}
                        <span className="text-gray-400">x{item.quantity}</span>
                      </span>
                      <span className="font-medium">
                        ${Number(item.amount).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400">No line items.</p>
              )}
            </div>
          </div>

          {/* Notes */}
          {expense.notes && (
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">
                {t("expenses.notesPlaceholder") || "Notes"}
              </label>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                {expense.notes}
              </p>
            </div>
          )}

          {/* Attachments */}
          {attachments.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 border-b pb-1">
                {t("expenses.attachment")} ({attachments.length})
              </h4>
              <div className="grid grid-cols-1 gap-3">
                {attachments.map((att, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <div className="p-2 bg-white border rounded">
                        <svg
                          className="w-6 h-6 text-gray-500"
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
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                          {att.fileName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {att.fileType}
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={() => setSelectedAttachment(att)}
                      className="text-sm !px-3 !py-1.5"
                    >
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button
              onClick={onClose}
              className="!bg-gray-500 hover:!bg-gray-600"
            >
              {t("expenses.closeForm") || "Close"}
            </Button>
          </div>
        </div>
      </Modal>

      {selectedAttachment && (
        <FilePreviewModal
          file={selectedAttachment}
          onClose={() => setSelectedAttachment(null)}
        />
      )}
    </>
  );
};

export default ExpenseDetailModal;
