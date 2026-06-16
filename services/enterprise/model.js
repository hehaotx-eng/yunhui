const { createCompanyCard, VerifiedLevel } = require('../core/contracts');

function createCompany(data = {}) {
  return createCompanyCard(data);
}

module.exports = {
  VerifiedLevel,
  createCompany
};
