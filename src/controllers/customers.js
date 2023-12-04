import connUtil from "../helpers/connectionUtil.js";
import errorResponses from "../helpers/errorResponses.js";

const controller = {};

const queries = {
  find: `
    SELECT
      id,
      code,
      fullName,
      address,
      dui,
      nit,
      nrc,
      email,
      customerTypeId,
      customerTypeName,
      applyForCredit,
      creditLimit,
      defPriceIndex
    FROM
      vw_customers;
  `,
  findById: `
    SELECT
      id,
      code,
      fullName,
      birthdate,
      customerTypeId,
      customerTypeName,
      dui,
      nit,
      nrc,
      businessLine,
      occupation,
      address,
      departmentId,
      cityId,
      deliveryRouteId,
      email,
      applyForCredit,
      creditLimit,
      defPriceIndex
    FROM
      vw_customers
    WHERE
      id = ?;

    SELECT * FROM customerphones WHERE customerId = ? AND isActive = 1;

    SELECT * FROM customerrelatives WHERE customerId = ? AND isActive = 1;
  `,
  findByLocation: `SELECT * FROM vw_customers WHERE locationId = ? OR locationId IS NULL;`,
  findTypes: `
    SELECT
      id,
      name
    FROM
      customertypes;
  `,
  findPendingSales: `
    SELECT * FROM vw_customerpendingsales WHERE customerId = ?;
  `,
  add: `
    INSERT INTO customers (customerTypeId, locationId, fullName, address, phone, email, dui, nit, nrc)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
  `,
  addv2: `
    INSERT INTO customers (
      code,
      customerTypeId,
      locationId,
      departmentId,
      cityId,
      deliveryRouteId,
      fullName,
      address,
      phone,
      email,
      dui,
      nit,
      nrc,
      businessLine,
      occupation,
      birthdate,
      applyForCredit,
      creditLimit,
      defPriceIndex
    )
    VALUES (
      (SELECT audit_getnextcustomercode()),
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?
    );

    SELECT LAST_INSERT_ID() AS insertId, (SELECT code FROM customers WHERE id = LAST_INSERT_ID()) AS insertCode;
  `,
  update: `
    UPDATE 
      customers
    SET
      customerTypeId = IFNULL(?, fullName),
      departmentId = IFNULL(?, departmentId),
      cityId = IFNULL(?, cityId),
      deliveryRouteId = IFNULL(?, deliveryRouteId),
      fullName = IFNULL(?, fullName),
      address = IFNULL(?, address),
      phone = IFNULL(?, phone),
      email = IFNULL(?, email),
      dui = IFNULL(?, dui),
      nit = IFNULL(?, nit),
      nrc = IFNULL(?, nrc),
      businessLine = IFNULL(?, businessLine),
      occupation = IFNULL(?, occupation),
      birthdate = IFNULL(?, birthdate),
      applyForCredit = IFNULL(?, applyForCredit),
      creditLimit = IFNULL(?, creditLimit),
      defPriceIndex = IFNULL(?, defPriceIndex)
    WHERE 
      id = ?;
  `,
  remove: `
    UPDATE 
      customers
    SET
      isActive = 0
    WHERE
      id = ?;
  `,
  phones: {
    add: `
      INSERT INTO customerphones (customerId, customerCode, phoneNumber, phoneType)
      VALUES ?;
    `,
    update: `
      UPDATE customerphones 
      SET phoneNumber = IFNULL(?, phoneNumber),
      phoneType = IFNULL(?, phoneType)
      WHERE id = ?;
    `,
    delete: `UPDATE customerphones SET isActive = 0 WHERE id = ?;`
  },
  relatives: {
    add: `
      INSERT INTO customerrelatives (customerId, customerCode, relativeFullname, relativeType, relativeAddress)
      VALUES ?;
    `,
    update: `
      UPDATE customerrelatives 
      SET relativeFullname = IFNULL(?, relativeFullname),
      relativeType = IFNULL(?, relativeType),
      relativeAddress = IFNULL(?, relativeAddress)
      WHERE id = ?;
    `,
    delete: `UPDATE customerrelatives SET isActive = 0 WHERE id = ?;`
  }
}

controller.find = (req, res) => {
  req.getConnection(connUtil.connFunc(queries.find, [], res));
}

controller.findById = (req, res) => {
  const { customerId } = req.params;
  req.getConnection(connUtil.connFunc(queries.findById, [ customerId || 0, customerId || 0, customerId || 0 ], res));
}

controller.findByLocation = (req, res) => {
  const { locationId } = req.params;
  req.getConnection(connUtil.connFunc(queries.findByLocation, [ locationId ], res));
}

controller.findTypes = (req, res) => {
  req.getConnection(connUtil.connFunc(queries.findTypes, [], res));
}

controller.findPendingSales = (req, res) => {
  const { customerId } = req.params;
  req.getConnection(connUtil.connFunc(queries.findPendingSales, [ customerId ], res));
}

controller.add = (req, res) => {
  const { customerTypeId, locationId, fullName, address, phone, email, dui, nit, nrc } = req.body;
  req.getConnection(connUtil.connFunc(queries.add, [ customerTypeId, locationId || 1, fullName, address, phone, email, dui, nit, nrc ], res));
}

// EXPECTED { customerPhones}
controller.addv2 = (controllerRequest, controllerResponse) => {
  controllerRequest.getConnection((connectionError, connection) => {
    if (connectionError) 
      controllerResponse.status(500).json(errorResponses.status500(connectionError));

    connection.beginTransaction((transactionError) => {
      if (transactionError)
        controllerResponse.status(500).json(errorResponses.status500(connectionError));

      const {
        customerTypeId,
        locationId,
        departmentId,
        cityId,
        deliveryRouteId,
        fullName,
        address,
        phone,
        email,
        dui,
        nit,
        nrc,
        businessLine,
        occupation,
        birthdate,
        applyForCredit,
        creditLimit,
        defPriceIndex
      } = controllerRequest.body;

      connection.query(
        queries.addv2,
        [
          customerTypeId,
          locationId,
          departmentId,
          cityId,
          deliveryRouteId || null,
          fullName,
          address,
          phone,
          email,
          dui || null,
          nit || null,
          nrc || null,
          businessLine || null,
          occupation || null,
          birthdate,
          applyForCredit ? 1 : 0,
          creditLimit,
          defPriceIndex || null
        ],
        (queryError, queryRows) => {
          if (queryError)
            return connection.rollback(() => controllerResponse.status(500).json(errorResponses.status500(queryError)));

          const customerInsertId = queryRows[0].insertId;
          const customerInsertCode = queryRows[1][0].insertCode;

          const { customerPhones } = controllerRequest.body;
          const { customerRelatives } = controllerRequest.body;

          if (customerPhones.length > 0 && customerPhones !== null) {
            const customerPhonesToInsert = customerPhones.map(
              (element) => [customerInsertId, customerInsertCode, element.phoneNumber, element.phoneType]
            );

            connection.query(
              queries.phones.add,
              [ customerPhonesToInsert ],
              (queryError, queryRows) => {
                if (queryError)
                  return connection.rollback(() => controllerResponse.status(500).json(errorResponses.status500(queryError)));
  
                if (customerRelatives.length > 0 && customerRelatives !== null) {
                  const customerRelativesToInsert = customerRelatives.map(
                    (element) => [customerInsertId, customerInsertCode, element.relativeFullname, element.relativeType, element.relativeAddress]
                  );
    
                  connection.query(
                    queries.relatives.add,
                    [ customerRelativesToInsert ],
                    (queryError, queryRows) => {
                      if (queryError)
                        return connection.rollback(() => controllerResponse.status(500).json(errorResponses.status500(queryError)));
        
                      connection.commit((commitError) => {
                        if (commitError)
                          return connection.rollback(() => {
                            controllerResponse.status(500).json(errorResponses.status500(queryError));
                          });
        
                        controllerResponse.json({message: `Success customer added: id-${customerInsertId}`, customerInsertId, customerInsertCode});
                      });
                    }
                  );
                } else {
                  connection.commit((commitError) => {
                    if (commitError)
                      return connection.rollback(() => {
                        controllerResponse.status(500).json(errorResponses.status500(queryError));
                      });
    
                    controllerResponse.json({message: `Success customer added: id-${customerInsertId}`, customerInsertId, customerInsertCode});
                  });
                }
              }
            );
          } else {
            if (customerRelatives.length > 0 && customerRelatives !== null) {
              const customerRelativesToInsert = customerRelatives.map(
                (element) => [customerInsertId, customerInsertCode, element.relativeFullname, element.relativeType, element.relativeAddress]
              );

              connection.query(
                queries.relatives.add,
                [ customerRelativesToInsert ],
                (queryError, queryRows) => {
                  if (queryError)
                    return connection.rollback(() => controllerResponse.status(500).json(errorResponses.status500(queryError)));
    
                  connection.commit((commitError) => {
                    if (commitError)
                      return connection.rollback(() => {
                        controllerResponse.status(500).json(errorResponses.status500(queryError));
                      });
    
                    controllerResponse.json({message: `Success customer added: id-${customerInsertId}`, customerInsertId, customerInsertCode});
                  });
                }
              );
            } else {
              connection.commit((commitError) => {
                if (commitError)
                  return connection.rollback(() => {
                    controllerResponse.status(500).json(errorResponses.status500(queryError));
                  });

                controllerResponse.json({message: `Success customer added: id-${customerInsertId}`, customerInsertId, customerInsertCode});
              });
            }
          }
        }
      );
    });
  });
}

controller.update = (req, res) => {
  const {
    customerTypeId,
    departmentId,
    cityId,
    deliveryRouteId,
    fullName,
    address,
    phone,
    email,
    dui,
    nit,
    nrc,
    businessLine,
    occupation,
    birthdate,
    applyForCredit,
    creditLimit,
    defPriceIndex,
    customerId
  } = req.body;

  req.getConnection(
    connUtil.connFunc(
      queries.update, [
        customerTypeId || null,
        departmentId || null,
        cityId || null,
        deliveryRouteId || null,
        fullName || null,
        address || null,
        phone || null,
        email || null,
        dui || null,
        nit || null,
        nrc || null,
        businessLine || null,
        occupation || null,
        birthdate || null,
        applyForCredit ? 1 : 0,
        creditLimit || null,
        defPriceIndex || null,
        customerId || 0
      ],
      res
    )
  );
}

controller.remove = (req, res) => {
  const { customerId } = req.params;
  req.getConnection(connUtil.connFunc(queries.remove, [ customerId || 0 ], res));
}

controller.addPhones = (req, res) => {
  // Expected: [[customerId, customerCode, phoneNumber, phoneType], [...]]
  const { customerPhones } = req.body;
  req.getConnection(connUtil.connFunc(queries.phones.add, [ customerPhones ], res));
};

controller.addRelatives = (req, res) => {
  // Expected: [[customerId, customerCode, relativeFullname, relativeType, relativeAddress], [...]]
  const { customerRelatives } = req.body;
  req.getConnection(connUtil.connFunc(queries.relatives.add, [ customerRelatives ], res));
};

controller.removePhone = (req, res) => {
  const { customerPhoneId } = req.params;
  req.getConnection(connUtil.connFunc(queries.phones.delete, [ customerPhoneId ], res));
};

controller.removeRelative = (req, res) => {
  const { customerRelativeId } = req.params;
  req.getConnection(connUtil.connFunc(queries.relatives.delete, [ customerRelativeId ], res));
};

export default controller;
