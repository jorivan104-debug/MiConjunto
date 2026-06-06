"""Modelos SQLAlchemy de Mi Conjunto.

Importar este módulo registra todas las entidades en el `Base.metadata`.
"""
from app.models.user import User, UserRole, UserCondominium, UserBackupCode
from app.models.role import Role
from app.models.organization import Organization
from app.models.condominium import Condominium
from app.models.block import Block
from app.models.resident import Resident
from app.models.property import Property, PropertyResident
from app.models.accounting import AccountingTransaction, Budget, BankReconciliation, ExpenseType
from app.models.accounting_puc import (
    ChartOfAccount,
    ThirdParty,
    BankAccount,
    JournalEntry,
    JournalLine,
    BankStatementLine,
    AccountType,
    JournalStatus,
)
from app.models.billing import (
    BillingDocument,
    BillingLine,
    BillingPayment,
    BillingStatus,
    ChargeType,
    PaymentMethod,
)
from app.models.inventory import (
    Warehouse,
    Supplier,
    SupplyItem,
    StockLevel,
    StockMovement,
    StockMovementType,
)
from app.models.maintenance import (
    MaintenanceAsset,
    WorkOrder,
    WorkOrderTask,
    WorkOrderMaterial,
    WorkOrderStatus,
    WorkOrderType,
    WorkOrderPriority,
)
from app.models.forum import (
    ForumCategory,
    ForumPost,
    ForumReply,
    ForumLike,
    ComplaintCase,
    ForumCategoryType,
    ForumPostStatus,
    ComplaintSeverity,
    ComplaintStatus,
)
from app.models.space_request import SpaceRequest
from app.models.meeting import Meeting, MeetingAttendance
from app.models.assembly import Assembly, AssemblyVote, VoteRecord, AssemblyAttendance
from app.models.administration_invoice import (
    AdministrationInvoice,
    InvoicePayment,
    InvoiceStatus,
)
from app.models.administration_invoice import PaymentMethod as InvoicePaymentMethod  # legacy alias
from app.models.document import Document
from app.models.notification import Notification
from app.models.document_attachment import DocumentAttachment, AttachmentEntityType
from app.models.audit import AuditLog

__all__ = [
    "User",
    "UserRole",
    "UserCondominium",
    "UserBackupCode",
    "Role",
    "Organization",
    "Condominium",
    "Block",
    "Resident",
    "Property",
    "PropertyResident",
    # accounting legacy
    "AccountingTransaction",
    "Budget",
    "BankReconciliation",
    "ExpenseType",
    # accounting PUC
    "ChartOfAccount",
    "ThirdParty",
    "BankAccount",
    "JournalEntry",
    "JournalLine",
    "BankStatementLine",
    "AccountType",
    "JournalStatus",
    # billing
    "BillingDocument",
    "BillingLine",
    "BillingPayment",
    "BillingStatus",
    "ChargeType",
    "PaymentMethod",
    # inventory
    "Warehouse",
    "Supplier",
    "SupplyItem",
    "StockLevel",
    "StockMovement",
    "StockMovementType",
    # maintenance
    "MaintenanceAsset",
    "WorkOrder",
    "WorkOrderTask",
    "WorkOrderMaterial",
    "WorkOrderStatus",
    "WorkOrderType",
    "WorkOrderPriority",
    # forum
    "ForumCategory",
    "ForumPost",
    "ForumReply",
    "ForumLike",
    "ComplaintCase",
    "ForumCategoryType",
    "ForumPostStatus",
    "ComplaintSeverity",
    "ComplaintStatus",
    # gobernanza
    "SpaceRequest",
    "Meeting",
    "MeetingAttendance",
    "Assembly",
    "AssemblyVote",
    "VoteRecord",
    "AssemblyAttendance",
    "AdministrationInvoice",
    "InvoicePayment",
    "InvoiceStatus",
    "InvoicePaymentMethod",
    "Document",
    "Notification",
    "DocumentAttachment",
    "AttachmentEntityType",
    "AuditLog",
]
