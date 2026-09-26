import { configureStore } from "@reduxjs/toolkit";
import apiReducer from "./reduxQuery";
import authReducer from "./authSlice";
import usersReducer from "./usersSlice";
import rolesReducer from "./rolesSlice";
import currenciesReducer from "./currencyMasterSlice";
import uomsReducer from "./uomMasterSlice";
import countriesReducer from "./countryMasterSlice";
import regionsReducer from "./regionMasterSlice";
import districtsReducer from "./districtMasterSlice";
import companyReducer from "./companyMasterSlice";
import campReducer from "./campMasterSlice";
import storeReducer from "./storeMasterSlice";
import productMainCategoryReducer from "./productMainCategoryMasterSlice";
import productSubCategoryReducer from "./productSubCategoryMasterSlice";
import costCentreReducer from "./costCentreMasterSlice";
import productReducer from "./productMasterSlice";
import userStoreMappingReducer from "./userStoreMappingSlice";
import navigationReducer from "./navigationSlice";
import subMenusReducer from "./subMenuSlice";
import exchangeRatesReducer from "./exchangeRateMasterSlice";
import animalReducer from "./animalMasterSlice";
import priceTypeReducer from "./priceTypeMasterSlice";
import salesPackageTypeReducer from "./salesPackageTypeMasterSlice";
import pricePackageReducer from "./pricePackageMasterSlice";
import priceListReducer from "./priceListMasterSlice";
import productOpeningStockReducer from "./productOpeningStockSlice";
import productCompanyMainCategoryMappingReducer from "./productCompanyMainCategoryMappingSlice";
import salesTypeMasterReducer from "./salesTypeMasterSlice";
import professionalHunterMasterReducer from "./professionalHunterMasterSlice";
import antiPoachingFindingsMasterReducer from "./antiPoachingFindingsMasterSlice";
import rackSectionMasterReducer from "./rackSectionMasterSlice";
import rackMasterReducer from "./rackMasterSlice";
import vatPercentageSettingReducer from "./vatPercentageSettingSlice";
import hotelResortMasterReducer from "./hotelResortMasterSlice";
import hotelRoomTypeMasterReducer from "./hotelRoomTypeMasterSlice";
import airlinesReducer from "./airlinesMasterSlice";
import caliberReducer from "./caliberMasterSlice";
import bulletTypeReducer from "./bulletTypeMasterSlice";
import ammunitionBrandReducer from "./ammunitionBrandMasterSlice";
import licensePermitTypesReducer from "./licensePermitTypeSlice";
import licensePermitCostReducer from "./licensePermitCostSlice";
import paymentModesReducer from "./paymentModeMasterSlice";
import paymentTriggerEventsReducer from "./paymentTriggerEventMasterSlice";
import departmentMasterReducer from "./departmentMasterSlice";
import designationMasterReducer from "./designationMasterSlice";
import departmentGroupMasterReducer from "./departmentGroupMasterSlice";
import gunTypeMasterReducer from "./gunTypeMasterSlice";
import gunCategoryMasterReducer from "./gunCategoryMasterSlice";
import trailerTypeMasterReducer from "./trailerTypeMasterSlice";
import busBoardingLocationMasterReducer from "./busBoardingLocationMasterSlice";
import visaTypeMasterReducer from "./visaTypeMasterSlice";
import employeeContractTypeMasterReducer from "./employeeContractTypeMasterSlice";
import employeeWorkingStatusMasterReducer from "./employeeWorkingStatusMasterSlice";
import fieldCombinedReducer from "./fieldCombinedSlice";
import companyQuotaAnimalMappingCombinedReducer from "./companyQuotaAnimalMappingCombinedSlice";
import animalHuntingChargesMasterCombinedReducer from "./animalHuntingChargesMasterCombinedSlice";
import employeeBenefitMasterCombinedReducer from "./employeeBenefitMasterCombinedSlice";
import tripTemplatePriceMappingReducer from "./tripTemplatePriceMappingSlice";
import customerWiseTripTemplatePriceMappingReducer from "./customerWiseTripTemplatePriceMappingSlice";
import gunBrandReducer from "./gunBrandMasterSlice";
import businessPartnerReducer from "./businessPartnerMasterSlice";
import gunMasterReducer from "./gunMasterSlice";
import bulletMasterReducer from "./bulletMasterSlice";
import bankMasterReducer from "./bankMasterSlice";
import companyBankAccountReducer from "./companyBankAccountMasterSlice";
import videographerMasterReducer from "./videographerMasterSlice";
import massagerMasterReducer from "./massagerMasterSlice";
import creditLimitPaymentModeMasterReducer from "./creditLimitPaymentModeMasterSlice";
import changePasswordReducer from "./changePasswordSlice";
import companyDepartmentDesignationMappingReducer from "./companyDepartmentDesignationMappingSlice";
import companyCampStoreMappingReducer from "./companyCampStoreMappingSlice";
import designationGroupMasterReducer from "./designationGroupMasterSlice";
import newSalaryScaleReducer from "./newSalaryScaleSlice";
import animalPartsMasterReducer from "./animalPartsMasterSlice";
import animalCategoryMasterReducer from "./animalCategoryMasterSlice";
import gunSourceTypeMasterReducer from "./gunSourceTypeMasterSlice";
import storeProductMinimumStockReducer from "./storeProductMinimumStockSlice";
import manPowerChangeRequestReducer from "./manPowerChangeRequestSlice";
import manPowerApprovedSettingsReducer from "./manPowerApprovedSettingsSlice";
import airportMasterReducer from "./airportMasterSlice";
import trailerMasterReducer from "./trailerMasterSlice";
import trailerMasterFilesReducer from "./trailerMasterFilesSlice";
import locationMasterReducer from "./locationMasterSlice";
import bloodGroupMasterReducer from "./bloodGroupMasterSlice";
import tripTemplateMasterReducer from "./tripTemplateMasterSlice";
import truckTypeMasterReducer from "./truckTypeMasterSlice";
import fuelStationMasterReducer from "./fuelStationMasterSlice";
import paymentTermMasterReducer from "./paymentTermMasterSlice";
import employmentTypeMasterReducer from "./employmentTypeMasterSlice";
import educationQualificationMasterReducer from "./educationQualificationMasterSlice";
import customerCreditLimitDetailsReducer from "./customerCreditLimitDetailsSlice";
import driverTruckMasterMappingReducer from "./driverTruckMasterMappingSlice";
import truckMasterHdrReducer from "./truckMasterHdrSlice";
import fuelTypeMasterReducer from "./fuelTypeMasterSlice";
import driverMasterReducer from "./driverMasterSlice";
import truckMasterFilesReducer from "./truckMasterFilesSlice";
import bpProductVatReducer from "./bpProductVatPercentageSettingsSlice";
import bpProductVatFilesReducer from "./bpProductVatPercentageSettingsFilesSlice";
import holidayEntriesReducer from "./holidayEntriesSlice";
import employeeDatabaseReducer from "./employeeDatabaseSlice";
import dmsReducer from "./dmsSlice";
import clientAdditionalServicesReducer from "./clientAdditionalServicesMasterSlice";
import driverMasterFilesReducer from "./driverMasterFilesSlice";
import attendanceTypeMasterReducer from "./attendanceTypeMasterSlice";
import attendanceDetailsReducer from "./attendanceDetailsSlice";
import attendanceRequestReducer from "./attendanceRequestSlice";
import cashAdvanceReducer from "./cashAdvanceSlice";
import cashAdvanceRequestReducer from "./cashAdvanceRequestSlice";
import arrearsRequestReducer from "./arrearsRequestSlice";
import arrearEntriesReducer from "./arrearEntriesSlice";
import overtimeRequestReducer from "./overtimeRequestSlice";
import overtimeEntriesReducer from "./overtimeEntriesSlice";
import bonusRequestReducer from "./bonusRequestSlice";
import bonusEntriesReducer from "./bonusEntriesSlice";
import leaveEncashmentReducer from "./leaveEncashmentSlice";
import leaveEncashmentEntriesReducer from "./leaveEncashmentEntriesSlice";
import promotionDemotionTransferRequestReducer from "./promotionDemotionTransferRequestSlice";
import promotionDemotionTransferEntriesReducer from "./promotionDemotionTransferEntriesSlice";
import payrollDeductionTypeMasterReducer from "./payrollDeductionTypeMasterSlice";
import monthlyAutoDeductionReducer from "./monthlyAutoDeductionSlice";
import deductionEntriesReducer from "./deductionEntriesSlice";
import employeeBenefitTypeMasterReducer from "./employeeBenefitTypeMasterSlice";
import overtimeReferenceEntriesReducer from "./overtimeReferenceEntriesSlice";
import laborChargeEntriesReducer from "./laborChargeEntriesSlice";
import warningFormsReducer from "./warningFormsSlice";
import shiftNameMasterReducer from "./shiftNameMasterSlice";
import employeeDailyShiftDetailsReducer from "./employeeDailyShiftDetailsSlice";
import weekDayMasterReducer from "./weekDayMasterSlice";
import bookingTypeMasterReducer from "./bookingTypeMasterSlice";
import bookingSourceMasterReducer from "./bookingSourceMasterSlice";
import branchMasterReducer from "./branchMasterSlice";
import priorityMasterReducer from "./priorityMasterSlice";
import bookingStatusMasterReducer from "./bookingStatusMasterSlice";
import participantTypeMasterReducer from "./participantTypeMasterSlice";
import visaStatusMasterReducer from "./visaStatusMasterSlice";
import expensePayerTypeMasterReducer from "./expensePayerTypeMasterSlice";
import permitAuthorityMasterReducer from "./permitAuthorityMasterSlice";
import taxMasterReducer from "./taxMasterSlice";
import reportMasterReducer from "./reportMasterSlice";
import purchaseRequestTypeMasterReducer from "./purchaseRequestTypeMasterSlice";
import statusMasterReducer from "./statusMasterSlice";
import referenceTypeMasterReducer from "./referenceTypeMasterSlice";
import shipmentModeMasterReducer from "./shipmentModeMasterSlice";
import purchaseRequestMasterReducer from "./purchaseRequestMasterSlice";
import additionalChargeTypeMasterReducer from "./additionalChargeTypeMasterSlice";

import { useAppDispatch, useAppSelector } from "./hooks";

export const store = configureStore({
  reducer: {
    api: apiReducer,
    auth: authReducer,
    users: usersReducer,
    roles: rolesReducer,
    currencies: currenciesReducer,
    uoms: uomsReducer,
    countries: countriesReducer,
    regions: regionsReducer,
    districts: districtsReducer,
    company: companyReducer,
    camp: campReducer,
    store: storeReducer,
    productMainCategory: productMainCategoryReducer,
    productSubCategory: productSubCategoryReducer,
    costCentre: costCentreReducer,
    product: productReducer,
    userStoreMapping: userStoreMappingReducer,
    
    navigation: navigationReducer,
    subMenus: subMenusReducer,
    exchangeRates: exchangeRatesReducer,
    animals: animalReducer,
    priceTypes: priceTypeReducer,
    salesPackageTypes: salesPackageTypeReducer,
    pricePackages: pricePackageReducer,
    priceLists: priceListReducer,
    productOpeningStock: productOpeningStockReducer,
    productCompanyMainCategoryMapping: productCompanyMainCategoryMappingReducer,
    salesTypeMaster: salesTypeMasterReducer,
    professionalHunterMaster: professionalHunterMasterReducer,
    antiPoachingFindingsMaster: antiPoachingFindingsMasterReducer,
    rackSectionMaster: rackSectionMasterReducer,
    rackMaster: rackMasterReducer,
    vatPercentageSetting: vatPercentageSettingReducer,
    hotelResortMaster: hotelResortMasterReducer,
    hotelRoomTypeMaster: hotelRoomTypeMasterReducer,
    airlines: airlinesReducer,
    caliber: caliberReducer,
    bulletType: bulletTypeReducer,
    ammunitionBrand: ammunitionBrandReducer,
    licensePermitTypes: licensePermitTypesReducer,
    licensePermitCost: licensePermitCostReducer,
    paymentModes: paymentModesReducer,
    paymentTriggerEvents: paymentTriggerEventsReducer,
    department: departmentMasterReducer,
    designation: designationMasterReducer,
    departmentGroup: departmentGroupMasterReducer,
    gunType: gunTypeMasterReducer,
    gunCategory: gunCategoryMasterReducer,
    trailerType: trailerTypeMasterReducer,
    busBoardingLocation: busBoardingLocationMasterReducer,
    visaType: visaTypeMasterReducer,
    employeeContractType: employeeContractTypeMasterReducer,
    employeeWorkingStatus: employeeWorkingStatusMasterReducer,
    creditLimitPaymentMode: creditLimitPaymentModeMasterReducer,
    fieldCombined: fieldCombinedReducer,
    companyQuotaAnimalMapping: companyQuotaAnimalMappingCombinedReducer,
    animalHuntingChargesMaster: animalHuntingChargesMasterCombinedReducer,
    employeeBenefitMaster: employeeBenefitMasterCombinedReducer,
    tripTemplatePriceMapping: tripTemplatePriceMappingReducer,
    customerWiseTripTemplatePriceMapping: customerWiseTripTemplatePriceMappingReducer,
    gunBrand: gunBrandReducer,
    businessPartner: businessPartnerReducer,
    gunMaster: gunMasterReducer,
    bulletMaster: bulletMasterReducer,
    bankMaster: bankMasterReducer,
    companyBankAccount: companyBankAccountReducer,
    videographerMaster: videographerMasterReducer,
    massagerMaster: massagerMasterReducer,
    companyDepartmentDesignationMapping: companyDepartmentDesignationMappingReducer,
    companyCampStoreMapping: companyCampStoreMappingReducer,
    designationGroupMaster: designationGroupMasterReducer,
    newSalaryScale: newSalaryScaleReducer,
    animalPartsMaster: animalPartsMasterReducer,
    animalCategoryMaster: animalCategoryMasterReducer,
    gunSourceTypeMaster: gunSourceTypeMasterReducer,
    storeProductMinimumStock: storeProductMinimumStockReducer,
    manPowerChangeRequest: manPowerChangeRequestReducer,
    manPowerApprovedSettings: manPowerApprovedSettingsReducer,
    airportMaster: airportMasterReducer,
    trailer: trailerMasterReducer,
    trailerFiles: trailerMasterFilesReducer,
    location: locationMasterReducer,
    bloodGroup: bloodGroupMasterReducer,
    tripTemplate: tripTemplateMasterReducer,
    changePassword: changePasswordReducer,
    truckType: truckTypeMasterReducer,
    fuelStation: fuelStationMasterReducer,
    paymentTerm: paymentTermMasterReducer,
    employmentType: employmentTypeMasterReducer,
    educationQualification: educationQualificationMasterReducer,
    customerCreditLimitDetails: customerCreditLimitDetailsReducer,
    driverTruckMasterMapping: driverTruckMasterMappingReducer,
    truckMaster: truckMasterHdrReducer,
    fuelType: fuelTypeMasterReducer,
    driverMaster: driverMasterReducer,
    truckMasterFiles: truckMasterFilesReducer,
    bpProductVat: bpProductVatReducer,
    bpVatFiles: bpProductVatFilesReducer,
    holidayEntries: holidayEntriesReducer,
    employeeDatabase: employeeDatabaseReducer,
    dms: dmsReducer,
    clientAdditionalServices: clientAdditionalServicesReducer,
   
    driverMasterFiles: driverMasterFilesReducer,
    attendanceType: attendanceTypeMasterReducer,
    attendanceDetails: attendanceDetailsReducer,
    attendanceRequest: attendanceRequestReducer,
    cashAdvance: cashAdvanceReducer,
    cashAdvanceRequest: cashAdvanceRequestReducer,
    arrearsRequest: arrearsRequestReducer,
    arrearEntries: arrearEntriesReducer,
    overtimeRequest: overtimeRequestReducer,
    overtimeEntries: overtimeEntriesReducer,
    bonusRequest: bonusRequestReducer,
    bonusEntries: bonusEntriesReducer,
    leaveEncashment: leaveEncashmentReducer,
    leaveEncashmentEntries: leaveEncashmentEntriesReducer,
    promotionDemotionTransferRequest: promotionDemotionTransferRequestReducer,
    promotionDemotionTransferEntries: promotionDemotionTransferEntriesReducer,
    payrollDeductionTypeMaster: payrollDeductionTypeMasterReducer,
    monthlyAutoDeduction: monthlyAutoDeductionReducer,
    deductionEntries: deductionEntriesReducer,
    employeeBenefitTypeMaster: employeeBenefitTypeMasterReducer,
    overtimeReferenceEntries: overtimeReferenceEntriesReducer,
    laborChargeEntries: laborChargeEntriesReducer,
    warningForms: warningFormsReducer,
    shiftNameMaster: shiftNameMasterReducer,
    employeeDailyShiftDetails: employeeDailyShiftDetailsReducer,
    weekDayMaster: weekDayMasterReducer,
    bookingType: bookingTypeMasterReducer,
    bookingSource: bookingSourceMasterReducer,
    branch: branchMasterReducer,
    priority: priorityMasterReducer,
    bookingStatus: bookingStatusMasterReducer,
    participantType: participantTypeMasterReducer,
    visaStatus: visaStatusMasterReducer,
    expensePayerType: expensePayerTypeMasterReducer,
    permitAuthorityMaster: permitAuthorityMasterReducer,
    taxMaster: taxMasterReducer,
    reportMaster: reportMasterReducer,
    purchaseRequestTypeMaster: purchaseRequestTypeMasterReducer,
    statusMaster: statusMasterReducer,
    referenceTypeMaster: referenceTypeMasterReducer,
    shipmentModeMaster: shipmentModeMasterReducer,
    purchaseRequestMaster: purchaseRequestMasterReducer,
    additionalChargeTypeMaster: additionalChargeTypeMasterReducer,

  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export { useAppDispatch, useAppSelector };