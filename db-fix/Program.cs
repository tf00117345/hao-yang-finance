using Microsoft.Data.Sqlite;

var connectionString = "Data Source=../hao-yang-finance-api/hao-yang-finance.db";

try
{
    using var connection = new SqliteConnection(connectionString);
    await connection.OpenAsync();
    
    // Check if tonnage column exists
    using var checkCmd = connection.CreateCommand();
    checkCmd.CommandText = "PRAGMA table_info(waybill)";
    
    bool tonnageExists = false;
    using var reader = await checkCmd.ExecuteReaderAsync();
    while (await reader.ReadAsync())
    {
        if (reader.GetString(1) == "tonnage")
        {
            tonnageExists = true;
            break;
        }
    }
    
    if (!tonnageExists)
    {
        using var cmd = connection.CreateCommand();
        cmd.CommandText = "ALTER TABLE waybill ADD COLUMN tonnage DECIMAL NOT NULL DEFAULT 0";
        await cmd.ExecuteNonQueryAsync();
        Console.WriteLine("✅ tonnage column added successfully!");
    }
    else
    {
        Console.WriteLine("ℹ️  tonnage column already exists!");
    }
    
    // Check extra_expense table columns
    using var checkExtraExpenseCmd = connection.CreateCommand();
    checkExtraExpenseCmd.CommandText = "PRAGMA table_info(extra_expense)";
    
    bool itemExists = false, feeExists = false, notesExists = false;
    using var expenseReader = await checkExtraExpenseCmd.ExecuteReaderAsync();
    while (await expenseReader.ReadAsync())
    {
        string columnName = expenseReader.GetString(1);
        if (columnName == "item") itemExists = true;
        if (columnName == "fee") feeExists = true;
        if (columnName == "notes") notesExists = true;
    }
    
    // Add missing columns to extra_expense table
    if (!itemExists)
    {
        using var cmd = connection.CreateCommand();
        cmd.CommandText = "ALTER TABLE extra_expense ADD COLUMN item TEXT NOT NULL DEFAULT ''";
        await cmd.ExecuteNonQueryAsync();
        Console.WriteLine("✅ item column added to extra_expense!");
    }
    
    if (!feeExists)
    {
        using var cmd = connection.CreateCommand();
        cmd.CommandText = "ALTER TABLE extra_expense ADD COLUMN fee DECIMAL NOT NULL DEFAULT 0";
        await cmd.ExecuteNonQueryAsync();
        Console.WriteLine("✅ fee column added to extra_expense!");
    }
    
    if (!notesExists)
    {
        using var cmd = connection.CreateCommand();
        cmd.CommandText = "ALTER TABLE extra_expense ADD COLUMN notes TEXT";
        await cmd.ExecuteNonQueryAsync();
        Console.WriteLine("✅ notes column added to extra_expense!");
    }
}
catch (Exception ex)
{
    Console.WriteLine($"❌ Error: {ex.Message}");
}