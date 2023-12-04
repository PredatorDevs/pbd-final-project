IF EXISTS (SELECT id FROM users WHERE PINCode = prmt_userPINCode AND isActive = 1)
THEN
    SET @isCashierOpen = (SELECT isOpen FROM cashiers WHERE id = prmt_cashier LIMIT 1);

    IF (@isCashierOpen = 1)
    THEN
        SET @currentCashierShiftcutId = (
            SELECT id
            FROM shiftcuts
            WHERE cashierId = prmt_cashier AND status = 1
        );
    
        IF (@currentCashierShiftcutId IS NOT NULL)
        THEN
            
        ELSE
            SIGNAL SQLSTATE '10404' SET MESSAGE_TEXT = 'There is not an opened shiftcut in this cashier to save the sale';
        END IF;
    ELSE
        SIGNAL SQLSTATE '10404' SET MESSAGE_TEXT = 'The cashier where you are trying to save your order is closed';
    END IF;
ELSE
    SIGNAL SQLSTATE '10404' SET MESSAGE_TEXT = 'The user PIN code you are trying to use is not valid';
END IF;