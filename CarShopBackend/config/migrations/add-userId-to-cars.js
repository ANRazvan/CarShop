const addUserIdToCarsMigration = `
ALTER TABLE "Cars"
ADD COLUMN IF NOT EXISTS "userId" INTEGER,
ADD CONSTRAINT "fk_car_user" 
FOREIGN KEY ("userId") 
REFERENCES "Users"(id)
ON DELETE SET NULL;
`;

module.exports = addUserIdToCarsMigration;
