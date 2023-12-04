-- db_todoparacakes.vw_sales source

CREATE OR REPLACE VIEW vw_sales AS
select
  sales.id AS id,
  sales.shiftcutId AS shiftcutId,
  sales.locationId AS locationId,
  loc.name AS locationName,
  sales.customerId AS customerId,
  sales.documentTypeId AS documentTypeId,
  doctypes.name AS documentTypeName,
  sales.paymentTypeId AS paymentTypeId,
  paytypes.name AS paymentTypeName,
  sales.createdBy AS createdBy,
  FN_GETUSERFULLNAME(sales.createdBy) AS createdByFullname,
  sales.docDatetime AS docDatetime,
  sales.docNumber AS docNumber,
  sales.serie AS serie,
  sales.paymentStatus AS paymentStatus,
  sales.expirationDays AS expirationDays,

  if(
    DATEDIFF(convert_tz(now(), '+00:00', '-06:00'), sales.docDatetime) > 0,
    concat('Vence en ', (sales.expirationDays - (DATEDIFF(convert_tz(now(), '+00:00', '-06:00'), sales.docDatetime))), ' días'),
    'Vencida'
  ) AS expirationInformation,

  if(
    DATEDIFF(convert_tz(now(), '+00:00', '-06:00'), sales.docDatetime) >= 0,
    0,
    1
  ) AS expired,

  sales.IVAretention AS IVAretention,
  sales.IVAperception AS IVAperception,
  FN_GETSALEPAYMENTSTATUS(sales.paymentStatus) AS paymentStatusName,
  sales.isVoided AS isVoided,
  FN_GETUSERFULLNAME(sales.voidedBy) AS voidedByFullname,
  round(sales.total, 2) AS total,
  round((select sum(vw_saledetails.totalTaxes) from vw_saledetails where ((vw_saledetails.saleId = sales.id) and (vw_saledetails.isActive = 1) and (vw_saledetails.isVoided = 0))), 2) AS totalTaxes,
  round((select sum(vw_saledetails.taxableSubTotal) from vw_saledetails where ((vw_saledetails.saleId = sales.id) and (vw_saledetails.isActive = 1) and (vw_saledetails.isVoided = 0))), 2) AS taxableSubTotal,
  round((select sum(vw_saledetails.taxableSubTotalWithoutTaxes) from vw_saledetails where ((vw_saledetails.saleId = sales.id) and (vw_saledetails.isActive = 1) and (vw_saledetails.isVoided = 0))), 2) AS taxableSubTotalWithoutTaxes,
  round((select sum(vw_saledetails.noTaxableSubTotal) from vw_saledetails where ((vw_saledetails.saleId = sales.id) and (vw_saledetails.isActive = 1) and (vw_saledetails.isVoided = 0))), 2) AS noTaxableSubTotal,
  fn_getsaletotalpaid(sales.id) AS saleTotalPaid,
  cus.fullName AS customerFullname,
  cus.address AS customerAddress,
  cus.dui AS customerDui,
  cus.nit AS customerNit,
  cus.nrc AS customerNrc,
  cus.businessLine AS customerBusinessLine,
  cus.occupation AS customerOccupation,
  (
  select
      departments.name
  from
      departments
  where
      (departments.id = cus.departmentId)) AS customerDepartmentName,
  (
  select
      cities.name
  from
      cities
  where
      (cities.id = cus.cityId)) AS customerCityName
from
  ((((sales
join customers cus on
  ((sales.customerId = cus.id)))
join locations loc on
  ((sales.locationId = loc.id)))
join documenttypes doctypes on
  ((sales.documentTypeId = doctypes.id)))
join paymenttypes paytypes on
  ((sales.paymentTypeId = paytypes.id)))
where
  (sales.isActive = 1);